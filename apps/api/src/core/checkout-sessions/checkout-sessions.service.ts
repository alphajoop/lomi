import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
const CHECKOUT_SESSION_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHECKOUT_SESSION_ID_PLACEHOLDER =
  /(\{\{CHECKOUT_SESSION_ID\}\}|\{CHECKOUT_SESSION_ID\})/i;
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { AuthContext } from '../common/decorators/current-user.decorator';
import {
  assertNetworkContextRecorded,
  namespaceNetworkIdempotency,
  recordNetworkContext,
} from '../common/network-context';
import type { CurrencyCode, Json } from '../../utils/types/api';
import { throwMappedSupabaseRpcError } from '../../utils/supabase-rpc-errors';
import { normalizeCheckoutFieldFlags } from '../../utils/checkout/resolve-checkout-form';
import type { IdempotentCreateResult } from '../../utils/idempotency-cache';

export type CheckoutIdempotencyContext = {
  key: string;
  bodyHash: string;
};

@Injectable()
export class CheckoutSessionsService {
  private readonly logger = new Logger(CheckoutSessionsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a new checkout session
   * Uses RPC: create_checkout_session for single product
   * Uses RPC: create_checkout_session_with_line_items for multi-product
   */
  async create(
    createDto: CreateCheckoutSessionDto,
    user: AuthContext,
    idempotency?: CheckoutIdempotencyContext,
  ): Promise<IdempotentCreateResult<unknown>> {
    const scopedIdempotency = namespaceNetworkIdempotency(user, idempotency);

    // currency_code is optional: Postgres RPC resolves organization default.
    const normalizedContactFlags = normalizeCheckoutFieldFlags({
      require_billing_address: createDto.require_billing_address,
      require_email: createDto.require_email,
      require_phone: createDto.require_phone,
      require_name: createDto.require_name,
      fields: createDto.fields,
    });

    if (
      normalizedContactFlags.require_name === false &&
      normalizedContactFlags.require_email === false &&
      normalizedContactFlags.require_phone === false &&
      !createDto.customer_name?.trim() &&
      !createDto.customer_id
    ) {
      throw new BadRequestException(
        'require_name cannot be false when email and phone are both hidden without customer_name or customer_id',
      );
    }

    if (createDto.line_items && createDto.line_items.length > 0) {
      // Idempotency is handled inside the RPC (advisory lock + records table).
      // A pre-RPC lookup was an extra Supabase round-trip on every keyed create.
      const contactFlagArgs = this.buildContactFlagRpcArgs(createDto);
      const rpcArgs = {
        p_organization_id: user.organizationId,
        p_created_by: user.merchantId,
        p_currency_code: (createDto.currency_code ?? null) as CurrencyCode,
        p_line_items: createDto.line_items as unknown as Json,
        p_environment: user.environment,
        p_customer_id: createDto.customer_id || null,
        p_metadata: mergeCheckoutMetadata(
          createDto.metadata,
          createDto.integration_source,
        ),
        p_title: createDto.title || null,
        p_description: createDto.description || null,
        p_success_url: createDto.success_url || null,
        p_cancel_url: createDto.cancel_url || null,
        p_customer_email: createDto.customer_email || null,
        p_customer_name: createDto.customer_name || null,
        p_customer_phone: createDto.customer_phone || null,
        p_customer_city: createDto.customer_city || null,
        p_customer_country: createDto.customer_country || null,
        p_customer_address: createDto.customer_address || null,
        p_customer_postal_code: createDto.customer_postal_code || null,
        p_allow_coupon_code: createDto.allow_coupon_code ?? false,
        p_expiration_minutes: 60,
        p_require_billing_address:
          contactFlagArgs.p_require_billing_address ?? false,
        p_require_email: contactFlagArgs.p_require_email,
        p_require_phone: contactFlagArgs.p_require_phone,
        p_require_name: contactFlagArgs.p_require_name,
        p_payment_link_id: createDto.payment_link_id || null,
        ...(scopedIdempotency
          ? {
              p_idempotency_key: scopedIdempotency.key,
              p_idempotency_body_hash: scopedIdempotency.bodyHash,
            }
          : {}),
      };

      const { data, error } = await this.supabase.rpc(
        'create_checkout_session_with_line_items',
        rpcArgs,
      );

      if (process.env.LOMI_DEBUG_CHECKOUT_RPC === '1') {
        this.logger.debug(
          'create_checkout_session_with_line_items RPC result:',
          {
            data,
            error,
          },
        );
      }

      if (error) throwMappedSupabaseRpcError(error.message);
      await this.recordNetworkCheckoutSession(data, user);
      return { data };
    }

    const blockingInvoice = await this.findBlockingInvoice(createDto, user);
    if (blockingInvoice) {
      const { data: checkout, error: checkoutError } = await this.supabase
        .getClient()
        .rpc(
          'create_invoice_checkout_session' as any,
          {
            p_invoice_id: blockingInvoice.invoice_id,
            p_created_by: user.merchantId,
            p_expiration_minutes: 60 * 24 * 7,
          } as any,
        );

      if (checkoutError) throw new Error(checkoutError.message);

      const checkoutPayload =
        checkout && typeof checkout === 'object'
          ? (checkout as Record<string, unknown>)
          : {};

      return {
        data: {
          payment_required: true,
          reason: 'invoice_payment_required',
          blocking_invoice: {
            invoice_id: blockingInvoice.invoice_id,
            invoice_number: blockingInvoice.invoice_number,
            amount_remaining: blockingInvoice.amount_remaining,
            currency_code: blockingInvoice.currency_code,
            checkout_url:
              checkoutPayload.checkout_url ??
              blockingInvoice.checkout_url ??
              blockingInvoice.payment_url,
          },
        },
      };
    }

    let amount: number | undefined = createDto.amount;
    if (amount == null && (createDto.product_id || createDto.price_id)) {
      amount =
        (await this.resolveCatalogAmount(createDto, user.organizationId)) ??
        undefined;
      if (amount == null) {
        throw new BadRequestException(
          'Product has no price configured. Provide amount or configure product prices.',
        );
      }
    }
    if (amount == null) {
      throw new BadRequestException(
        'amount is required when product_id is not provided',
      );
    }

    // Idempotency is handled inside create_checkout_session (see SQL advisory lock).
    const contactFlagArgs = this.buildContactFlagRpcArgs(createDto);
    const rpcArgs = {
      p_organization_id: user.organizationId,
      p_environment: user.environment,
      p_created_by: user.merchantId,
      p_amount: amount,
      p_currency_code: (createDto.currency_code ?? null) as CurrencyCode,
      p_customer_id: createDto.customer_id || null,
      p_metadata: mergeCheckoutMetadata(
        createDto.metadata,
        createDto.integration_source,
      ),
      p_title: createDto.title || null,
      p_description: createDto.description || null,
      p_product_id: createDto.product_id || null,
      p_price_id: createDto.price_id || null,
      p_subscription_id: createDto.subscription_id || null,
      p_allow_quantity: createDto.allow_quantity ?? false,
      p_quantity: createDto.quantity ?? 1,
      p_success_url: createDto.success_url || null,
      p_cancel_url: createDto.cancel_url || null,
      p_customer_email: createDto.customer_email || null,
      p_customer_name: createDto.customer_name || null,
      p_customer_phone: createDto.customer_phone || null,
      p_customer_city: createDto.customer_city || null,
      p_customer_country: createDto.customer_country || null,
      p_customer_address: createDto.customer_address || null,
      p_customer_postal_code: createDto.customer_postal_code || null,
      p_allow_coupon_code: createDto.allow_coupon_code ?? false,
      p_require_billing_address:
        contactFlagArgs.p_require_billing_address ?? false,
      p_require_email: contactFlagArgs.p_require_email,
      p_require_phone: contactFlagArgs.p_require_phone,
      p_require_name: contactFlagArgs.p_require_name,
      p_payment_link_id: createDto.payment_link_id || null,
      ...(scopedIdempotency
        ? {
            p_idempotency_key: scopedIdempotency.key,
            p_idempotency_body_hash: scopedIdempotency.bodyHash,
          }
        : {}),
    };

    const { data, error } = await this.supabase.rpc(
      'create_checkout_session',
      rpcArgs,
    );

    if (process.env.LOMI_DEBUG_CHECKOUT_RPC === '1') {
      this.logger.debug('create_checkout_session RPC result:', { data, error });
    }

    if (error) throwMappedSupabaseRpcError(error.message);
    await this.recordNetworkCheckoutSession(data, user);
    return { data };
  }

  async findAll(
    user: AuthContext,
    status?: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    const { data, error } = await this.supabase.rpc('list_checkout_sessions', {
      p_merchant_id: user.merchantId,
      p_status: (status as never) || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findOne(id: string, user: AuthContext) {
    const sessionId = id?.trim();
    if (!sessionId) {
      throw new BadRequestException('Checkout session id must be a UUID');
    }

    if (CHECKOUT_SESSION_ID_PLACEHOLDER.test(sessionId)) {
      throw new BadRequestException(
        'Checkout session id must be the UUID returned by POST /checkout-sessions, not the {CHECKOUT_SESSION_ID} success_url placeholder',
      );
    }

    if (!CHECKOUT_SESSION_ID_UUID.test(sessionId)) {
      throw new BadRequestException('Checkout session id must be a UUID');
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'get_checkout_session_api' as any,
      {
        p_checkout_session_id: sessionId,
        p_organization_id: user.organizationId,
      } as any,
    );

    const dataArray = Array.isArray(data) ? data : [data];
    const session = dataArray[0];

    if (error || !session) {
      throw new NotFoundException(
        `Checkout session with ID ${sessionId} not found or access denied`,
      );
    }

    return session;
  }

  private async recordNetworkCheckoutSession(
    data: unknown,
    user: AuthContext,
  ): Promise<void> {
    const checkoutSessionId = extractCheckoutSessionId(data);
    if (!checkoutSessionId) {
      return;
    }

    const networkContext = await recordNetworkContext(this.supabase, user, {
      checkoutSessionId,
      capabilityKey: 'payment.create',
      metadata: {
        source: 'api_checkout_session',
      },
    });
    assertNetworkContextRecorded(user, networkContext, 'checkout session');
  }

  /** Map DTO / fields[] contact flags onto create-session RPC defaults. */
  private buildContactFlagRpcArgs(createDto: CreateCheckoutSessionDto): {
    p_require_billing_address: boolean | null;
    p_require_email: boolean;
    p_require_phone: boolean;
    p_require_name: boolean;
  } {
    const normalized = normalizeCheckoutFieldFlags({
      require_billing_address: createDto.require_billing_address,
      require_email: createDto.require_email,
      require_phone: createDto.require_phone,
      require_name: createDto.require_name,
      fields: createDto.fields,
    });

    return {
      p_require_billing_address:
        normalized.require_billing_address ??
        createDto.require_billing_address ??
        false,
      p_require_email: normalized.require_email ?? true,
      p_require_phone: normalized.require_phone ?? true,
      p_require_name: normalized.require_name ?? true,
    };
  }

  private async findBlockingInvoice(
    createDto: CreateCheckoutSessionDto,
    user: AuthContext,
  ): Promise<BlockingInvoice | null> {
    if (createDto.metadata?.['payment_flow'] === 'invoice_payment') {
      return null;
    }

    if (!createDto.customer_id && !createDto.subscription_id) {
      return null;
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'get_blocking_customer_obligations' as any,
      {
        p_organization_id: user.organizationId,
        p_customer_id: createDto.customer_id || null,
        p_product_id: createDto.product_id || null,
        p_subscription_id: createDto.subscription_id || null,
        p_environment: user.environment,
      } as any,
    );

    if (error) throw new Error(error.message);

    const obligations = Array.isArray(data) ? data : [];
    const invoice = obligations[0] as Partial<BlockingInvoice> | undefined;
    if (!invoice?.invoice_id) {
      return null;
    }

    return invoice as BlockingInvoice;
  }

  private async resolveCatalogAmount(
    dto: CreateCheckoutSessionDto,
    organizationId: string,
  ): Promise<number | null> {
    const { data, error } = await this.supabase.rpc(
      'resolve_checkout_catalog_amount' as never,
      {
        p_organization_id: organizationId,
        p_product_id: dto.product_id || null,
        p_price_id: dto.price_id || null,
        p_quantity: dto.quantity ?? 1,
      } as never,
    );

    if (error || data == null) {
      return null;
    }

    return Number(data);
  }
}

type BlockingInvoice = {
  invoice_id: string;
  invoice_number: string | null;
  amount_remaining: number;
  currency_code: string;
  payment_url: string | null;
  checkout_url: string | null;
};

function extractCheckoutSessionId(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    return null;
  }

  const value = (row as Record<string, unknown>).checkout_session_id;
  return typeof value === 'string' ? value : null;
}

function mergeCheckoutMetadata(
  metadata: Record<string, unknown> | undefined,
  integrationSource?: string,
): Json | null {
  const merged: Record<string, unknown> = { ...(metadata ?? {}) };

  if (integrationSource) {
    merged.integration_source = integrationSource;
  }

  return Object.keys(merged).length > 0 ? (merged as Json) : null;
}
