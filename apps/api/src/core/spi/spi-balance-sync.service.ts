import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';

@Injectable()
export class SpiBalanceSyncService {
  private readonly logger = new Logger(SpiBalanceSyncService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async syncOrganizationBalance(
    organizationId: string,
    currencyCode = 'XOF',
  ): Promise<{ organizationId: string; balance: number | null; synced: boolean }> {
    const { data: accountNumber, error: accountError } = await this.supabase.rpc(
      'get_spi_account_number' as never,
      {
        p_organization_id: organizationId,
        p_currency_code: currencyCode,
      } as never,
    );

    if (accountError || !accountNumber) {
      return { organizationId, balance: null, synced: false };
    }

    try {
      const account = (await this.spiClient.executeWithSdk(
        organizationId,
        (sdk) => sdk.comptes.getAccount(accountNumber as string),
      )) as { solde?: number; balance?: number };

      const balance =
        typeof account.solde === 'number'
          ? account.solde
          : typeof account.balance === 'number'
            ? account.balance
            : null;

      if (balance !== null) {
        await this.supabase.rpc('update_spi_account_balance' as never, {
          p_organization_id: organizationId,
          p_currency_code: currencyCode,
          p_balance: balance / 100,
          p_synced_at: new Date().toISOString(),
        } as never);
      }

      return { organizationId, balance, synced: balance !== null };
    } catch (error) {
      this.logger.warn(
        `SPI balance sync failed for org ${organizationId}: ${error instanceof Error ? error.message : error}`,
      );
      return { organizationId, balance: null, synced: false };
    }
  }

  async syncAllSpiAccounts(): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const { data: accounts, error } = await this.supabase.rpc(
      'list_spi_accounts_for_balance_sync' as never,
      {} as never,
    );

    const rows = (accounts ?? []) as Array<{
      organization_id: string;
      currency_code: string;
    }>;

    if (error || rows.length === 0) {
      return { total: 0, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const account of rows) {
      const result = await this.syncOrganizationBalance(
        account.organization_id,
        account.currency_code,
      );
      if (result.synced) {
        synced += 1;
      } else {
        failed += 1;
      }
    }

    return { total: rows.length, synced, failed };
  }

  async listOrgsMissingSpiAccount(): Promise<
    Array<{
      organization_id: string;
      organization_name: string;
      currency_code: string;
    }>
  > {
    const { data, error } = await this.supabase.rpc(
      'list_orgs_missing_spi_account' as never,
      {} as never,
    );

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}
