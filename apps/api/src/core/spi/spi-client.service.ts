import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { PiSpiSDK } from 'pi-spi-sdk';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { loadSpiPlatformConfig } from './spi-config';
import { getSpiMtlsDispatcher } from './spi-transport';
import { SpiTokenService } from './spi-token.service';
import { createPiSpiSdk, isPiSpiAuthError } from './spi-sdk.loader';

@Injectable()
export class SpiClientService {
  private readonly logger = new Logger(SpiClientService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly tokenService: SpiTokenService,
  ) {}

  async getSdk(organizationId: string): Promise<PiSpiSDK> {
    await this.assertOrgSpiConnected(organizationId);
    return this.buildSdk();
  }

  async getPlatformSdk(): Promise<PiSpiSDK> {
    return this.buildSdk();
  }

  async executeWithSdk<T>(
    organizationId: string,
    operation: (sdk: PiSpiSDK) => Promise<T>,
  ): Promise<T> {
    await this.assertOrgSpiConnected(organizationId);

    try {
      const sdk = await this.buildSdk();
      return await operation(sdk);
    } catch (error) {
      if (!(await this.isAuthError(error))) {
        throw error;
      }

      this.logger.warn(
        'PI-SPI auth error — invalidating token and retrying once',
      );
      this.tokenService.invalidate();
      const sdk = await this.buildSdk();
      return operation(sdk);
    }
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

    const created = await this.executeWithSdk(organizationId, (sdk) =>
      sdk.alias.create({
        compte: spiAccountNumber,
        type: 'SHID',
      }),
    );

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

  private async buildSdk(): Promise<PiSpiSDK> {
    const config = loadSpiPlatformConfig();
    const accessToken = await this.tokenService.getAccessToken();
    const dispatcher = getSpiMtlsDispatcher();

    return createPiSpiSdk({
      baseUrl: config.baseUrl,
      accessToken,
      ...(dispatcher ? { dispatcher } : {}),
    });
  }

  private async assertOrgSpiConnected(organizationId: string): Promise<void> {
    const { data, error } = await this.supabase.rpc(
      'get_spi_provider_metadata' as never,
      { p_organization_id: organizationId } as never,
    );

    if (error) {
      this.logger.error(
        `SPI provider lookup failed for org ${organizationId}: ${error.message}`,
      );
      throw new BadRequestException(
        'SPI provider is not configured for this organization',
      );
    }

    if (data === null || data === undefined) {
      throw new BadRequestException(
        'SPI provider is not connected for this organization',
      );
    }
  }

  private async isAuthError(error: unknown): Promise<boolean> {
    if (await isPiSpiAuthError(error)) {
      return true;
    }

    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: number }).status === 401
    ) {
      return true;
    }

    return false;
  }
}
