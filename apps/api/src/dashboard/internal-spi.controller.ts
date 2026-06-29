import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../core/common/guards/internal-api-key.guard';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { SpiBalanceSyncService } from '../core/spi/spi-balance-sync.service';

type ProvisionSpiAccountBody = {
  organizationId: string;
  accountNumber: string;
  currencyCode?: string;
  accountType?: string;
};

@ApiExcludeController()
@ApiTags('Internal')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/spi')
export class InternalSpiController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly balanceSync: SpiBalanceSyncService,
  ) {}

  @Post('provision-account')
  @ApiOperation({
    summary: 'Provision merchant SPI receive account (service_role RPC)',
  })
  async provisionAccount(@Body() body: ProvisionSpiAccountBody) {
    const organizationId = body.organizationId?.trim();
    const accountNumber = body.accountNumber?.trim();

    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    if (!accountNumber) {
      throw new BadRequestException('accountNumber is required');
    }

    const { data, error } = await this.supabase.rpc(
      'provision_spi_account' as never,
      {
        p_organization_id: organizationId,
        p_account_number: accountNumber,
        p_currency_code: body.currencyCode ?? 'XOF',
        p_account_type: body.accountType ?? 'CACC',
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  @Post('sync-balances')
  @ApiOperation({ summary: 'Sync SPI account balances for all provisioned orgs' })
  syncBalances() {
    return this.balanceSync.syncAllSpiAccounts();
  }

  @Post('sync-balance')
  @ApiOperation({ summary: 'Sync SPI account balance for one organization' })
  syncOrganizationBalance(
    @Body() body: { organizationId: string; currencyCode?: string },
  ) {
    if (!body.organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }

    return this.balanceSync.syncOrganizationBalance(
      body.organizationId.trim(),
      body.currencyCode ?? 'XOF',
    );
  }

  @Post('list-orgs-missing-account')
  @ApiOperation({ summary: 'List orgs with SPI connected but no account number' })
  listOrgsMissingAccount() {
    return this.balanceSync.listOrgsMissingSpiAccount();
  }
}
