import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { SpiClientService } from '../core/spi/spi-client.service';
import { normalizeUemoaCountryCode } from '../core/spi/spi.utils';

type SpiProviderConnectionRow = {
  is_connected: boolean;
  metadata: unknown;
};

type SpiAccountSnapshotRow = {
  spi_account_number: string | null;
  spi_account_balance: number | null;
  spi_account_balance_synced_at: string | null;
  is_spi_account: boolean;
};

@Injectable()
export class DashboardSpiStatusService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async getStatus(organizationId: string) {
    const { data: providerRows } = await this.supabase.rpc(
      'get_spi_provider_connection' as never,
      { p_organization_id: organizationId } as never,
    );

    const providerRow = (Array.isArray(providerRows)
      ? providerRows[0]
      : providerRows) as SpiProviderConnectionRow | null | undefined;

    const { data: accountNumber } = await this.supabase.rpc(
      'get_spi_account_number' as never,
      {
        p_organization_id: organizationId,
        p_currency_code: 'XOF',
      } as never,
    );

    const { data: accountRows } = await this.supabase.rpc(
      'get_spi_account_snapshot' as never,
      {
        p_organization_id: organizationId,
        p_currency_code: 'XOF',
      } as never,
    );

    const accountRow = (Array.isArray(accountRows)
      ? accountRows[0]
      : accountRows) as SpiAccountSnapshotRow | null | undefined;

    let shidAlias: string | null = null;
    const spiAccount =
      (accountNumber as string | null) ?? accountRow?.spi_account_number ?? null;

    if (spiAccount) {
      const { data: aliasKey } = await this.supabase.rpc(
        'get_spi_account_alias' as never,
        {
          p_account_number: spiAccount,
          p_alias_type: 'SHID',
        } as never,
      );
      shidAlias = (aliasKey as string | null) ?? null;
    }

    return {
      connected: providerRow?.is_connected ?? true,
      accountProvisioned: Boolean(spiAccount),
      spiAccountNumber: spiAccount,
      shidAlias,
      spiAccountBalance: accountRow?.spi_account_balance ?? null,
      balanceSyncedAt: accountRow?.spi_account_balance_synced_at ?? null,
      runbookUrl:
        'https://github.com/lomiafrica/lomi/blob/main/apps/api/docs/spi-pos-e2e-runbook.md',
    };
  }

  async generateQrPayload(
    organizationId: string,
    body: {
      amount?: number;
      referenceLabel?: string;
      qrType?: 'STATIC' | 'DYNAMIC';
    },
  ) {
    const status = await this.getStatus(organizationId);
    if (!status.spiAccountNumber) {
      throw new BadRequestException('SPI account not provisioned');
    }

    const alias = await this.spiClient.getOrCreateMerchantShidAlias(
      organizationId,
      status.spiAccountNumber,
    );

    const { data: countryCode } = await this.supabase.rpc(
      'get_organization_uemoa_country_code' as never,
      { p_organization_id: organizationId } as never,
    );

    const country = normalizeUemoaCountryCode(
      (countryCode as string | null) ?? 'SN',
    );
    const qrType = body.qrType ?? (body.amount ? 'DYNAMIC' : 'STATIC');
    const referenceLabel = (body.referenceLabel ?? 'LOMI').substring(0, 25);

    const sdk = await this.spiClient.getSdk(organizationId);
    const qrPayload = sdk.qr.payload({
      alias,
      countryCode: country,
      qrType,
      referenceLabel,
      amount:
        qrType === 'DYNAMIC' && body.amount
          ? Math.round(body.amount * 100)
          : undefined,
    });

    return {
      spiAccountNumber: status.spiAccountNumber,
      alias,
      qrPayload,
      qrType,
    };
  }
}
