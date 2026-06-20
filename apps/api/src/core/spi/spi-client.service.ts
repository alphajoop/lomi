import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PiSpiSDK, AliasType } from 'pi-spi-sdk';
import { SupabaseService } from '../../utils/supabase/supabase.service';

type SpiProviderMetadata = {
  spi_access_token?: string;
  spi_base_url?: string;
};

@Injectable()
export class SpiClientService {
  private readonly logger = new Logger(SpiClientService.name);
  private readonly defaultBaseUrl =
    process.env.SPI_BASE_URL ?? 'https://sandbox.api.pi-bceao.com/piz/v1';

  constructor(private readonly supabase: SupabaseService) {}

  async getSdk(organizationId: string): Promise<PiSpiSDK> {
    const { data, error } = await this.supabase.rpc(
      'get_spi_provider_metadata' as never,
      { p_organization_id: organizationId } as never,
    );

    if (error || !data) {
      this.logger.error(
        `SPI metadata lookup failed for org ${organizationId}: ${error?.message}`,
      );
      throw new BadRequestException(
        'SPI provider is not configured for this organization',
      );
    }

    const metadata = data as SpiProviderMetadata;
    const accessToken = metadata.spi_access_token;
    const baseUrl = metadata.spi_base_url ?? this.defaultBaseUrl;

    if (!accessToken) {
      throw new BadRequestException('SPI access token is missing');
    }

    return new PiSpiSDK({ baseUrl, accessToken });
  }

  async getOrCreateMerchantShidAlias(
    organizationId: string,
    spiAccountNumber: string,
  ): Promise<string> {
    const { data: existingAlias, error: aliasError } = await this.supabase.rpc(
      'get_spi_account_alias' as never,
      {
        p_account_number: spiAccountNumber,
        p_alias_type: 'SHID',
      } as never,
    );

    if (aliasError) {
      this.logger.warn(`get_spi_account_alias failed: ${aliasError.message}`);
    }

    const aliasValue = existingAlias as string | null;
    if (typeof aliasValue === 'string' && aliasValue.length > 0) {
      return aliasValue;
    }

    const sdk = await this.getSdk(organizationId);
    const created = await sdk.alias.create({
      compte: spiAccountNumber,
      type: AliasType.SHID,
    });

    const aliasKey = created.cle;
    if (!aliasKey) {
      throw new BadRequestException('Failed to create SPI SHID alias');
    }

    const { error: storeError } = await this.supabase.rpc(
      'create_spi_account_alias' as never,
      {
        p_organization_id: organizationId,
        p_account_number: spiAccountNumber,
        p_alias_type: 'SHID',
        p_alias_key: aliasKey,
      } as never,
    );

    if (storeError) {
      this.logger.warn(
        `create_spi_account_alias failed (alias still usable): ${storeError.message}`,
      );
    }

    return aliasKey;
  }
}
