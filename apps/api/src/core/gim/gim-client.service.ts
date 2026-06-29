import { Injectable, Logger } from '@nestjs/common';
import {
  assertGimPlatformCredentialsConfigured,
  GimPlatformConfig,
  loadGimPlatformConfig,
} from './gim-config';
import { GimHmacService } from './gim-hmac.service';
import {
  GIM_CURRENCY_CODE,
  buildDateTimeLocalTrxn,
  sanitizeGimLogPayload,
} from './gim.utils';

export type PayByCardRequest = {
  PAN: string;
  DateExpiration: string;
  cvv2: string;
  AmountTrxn: number;
  CurrencyCodeTrxn: string;
  IsWebRequest: boolean;
  MerchantReference: string | null;
  MerchantId: string;
  TerminalId: string;
  DateTimeLocalTrxn: string;
  MotoFlag: string;
  email: string | null;
  CardHolderName: string | null;
  EComIp: string | null;
  MobileNo: string | null;
  ReturnURL: string | null;
  Disable3DS: boolean;
  SecureHash: string;
};

export type PayByCardResponse = {
  SystemReference?: number;
  NetworkReference?: string;
  ReceiptNumber?: string;
  AuthCode?: string;
  ActionCode?: string;
  MerchantReference?: string | null;
  ChallengeRequired?: boolean;
  ThreeDSUrl?: string | null;
  Message?: string | null;
  Success?: boolean;
  RefNumber?: string;
  TransactionNo?: string;
};

export type GimPayByCardInput = {
  pan: string;
  expiryYyMm: string;
  cvv2: string;
  amountMinorUnits: number;
  merchantReference: string;
  cardHolderName?: string;
  email?: string;
  ecomIp?: string;
  mobileNo?: string;
  disable3ds?: boolean;
  dateTimeLocalTrxn?: string;
};

export type GimPayByCardResult =
  | {
      kind: 'redirect_3ds';
      threeDsUrl: string;
      systemReference?: number;
      raw: PayByCardResponse;
    }
  | {
      kind: 'final';
      approved: boolean;
      actionCode?: string;
      message?: string | null;
      systemReference?: number;
      networkReference?: string;
      authCode?: string;
      raw: PayByCardResponse;
    };

const DEFAULT_TIMEOUT_MS = 30_000;

@Injectable()
export class GimClientService {
  private readonly logger = new Logger(GimClientService.name);
  private cachedConfig: GimPlatformConfig | null = null;

  constructor(private readonly hmac: GimHmacService) {}

  // Lazy so the API boots in "standby" without GIM env configured.
  // Config (and its production validation) is only resolved when a GIM Pay
  // call is actually attempted, never at module instantiation/boot.
  getConfig(): GimPlatformConfig {
    if (!this.cachedConfig) {
      this.cachedConfig = loadGimPlatformConfig();
    }
    return this.cachedConfig;
  }

  buildPayByCardBody(
    input: GimPayByCardInput,
    config: GimPlatformConfig = this.getConfig(),
  ): PayByCardRequest {
    assertGimPlatformCredentialsConfigured(config);

    const DateTimeLocalTrxn =
      input.dateTimeLocalTrxn ??
      buildDateTimeLocalTrxn(new Date(), config.dateTimeLocalTrxnDigitLength);

    const SecureHash = this.hmac.signRequest(
      {
        DateTimeLocalTrxn,
        MerchantId: config.merchantId,
        TerminalId: config.terminalId,
      },
      config.secretKeyHex,
    );

    return {
      PAN: input.pan.replace(/\s/g, ''),
      DateExpiration: input.expiryYyMm,
      cvv2: input.cvv2,
      AmountTrxn: input.amountMinorUnits,
      CurrencyCodeTrxn: GIM_CURRENCY_CODE,
      IsWebRequest: true,
      MerchantReference: input.merchantReference,
      MerchantId: config.merchantId,
      TerminalId: config.terminalId,
      DateTimeLocalTrxn,
      MotoFlag: '0',
      email: input.email ?? null,
      CardHolderName: input.cardHolderName ?? null,
      EComIp: input.ecomIp ?? null,
      MobileNo: input.mobileNo ?? null,
      ReturnURL: config.returnUrl,
      Disable3DS: input.disable3ds ?? config.disable3ds,
      SecureHash,
    };
  }

  parsePayByCardResponse(data: unknown): PayByCardResponse {
    if (!data || typeof data !== 'object') {
      return {};
    }
    return data as PayByCardResponse;
  }

  classifyResponse(raw: PayByCardResponse): GimPayByCardResult {
    if (raw.ChallengeRequired === true && raw.ThreeDSUrl) {
      return {
        kind: 'redirect_3ds',
        threeDsUrl: raw.ThreeDSUrl,
        systemReference: raw.SystemReference,
        raw,
      };
    }

    const actionCode = raw.ActionCode;
    const approved =
      raw.Success === true &&
      (actionCode === '000' ||
        actionCode === '001' ||
        actionCode === '003' ||
        actionCode === '007' ||
        actionCode === '00');

    return {
      kind: 'final',
      approved,
      actionCode,
      message: raw.Message,
      systemReference: raw.SystemReference,
      networkReference: raw.NetworkReference,
      authCode: raw.AuthCode,
      raw,
    };
  }

  async payByCard(
    input: GimPayByCardInput,
    options?: { fetchImpl?: typeof fetch; timeoutMs?: number },
  ): Promise<GimPayByCardResult> {
    const config = this.getConfig();
    assertGimPlatformCredentialsConfigured(config);

    const body = this.buildPayByCardBody(input, config);
    const fetchImpl = options?.fetchImpl ?? fetch;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(config.payByCardUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        this.logger.error({
          message: 'gim_pay_by_card_invalid_json',
          status: response.status,
        });
        throw new GimTransportError('GIM Pay returned invalid JSON');
      }

      if (!response.ok) {
        this.logger.error({
          message: 'gim_pay_by_card_http_error',
          status: response.status,
        });
        throw new GimTransportError(`GIM Pay HTTP error: ${response.status}`);
      }

      const raw = this.parsePayByCardResponse(parsed);
      return this.classifyResponse(raw);
    } catch (error) {
      if (error instanceof GimTransportError) {
        throw error;
      }
      const message = sanitizeGimLogPayload(
        error instanceof Error ? error.message : 'GIM Pay request failed',
      );
      this.logger.error({ message: 'gim_pay_by_card_failed', error: message });
      throw new GimTransportError(message);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class GimTransportError extends Error {
  readonly transportError = true;

  constructor(message: string) {
    super(message);
    this.name = 'GimTransportError';
  }
}
