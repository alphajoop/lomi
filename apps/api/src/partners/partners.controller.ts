import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PartnerKeyGuard } from '../core/common/guards/partner-key.guard';
import type { PartnerContext } from '../core/common/guards/partner-key.guard';
import { CurrentPartner } from './decorators/current-partner.decorator';
import { MintPartnerProvisioningKeyDto } from './dto/mint-partner-provisioning-key.dto';
import { PartnersService } from './partners.service';

@ApiTags('Partners')
@ApiSecurity('partner-key')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@UseGuards(PartnerKeyGuard)
@Controller('partners/v1')
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Post('provisioning-keys')
  @ApiOperation({
    summary: 'Mint a per-user provisioning key',
    description:
      'Creates a scoped lomi_prov_* key for an end user. The key can be passed to MCP or /provisioning/v1 for agent onboarding.',
  })
  mintProvisioningKey(
    @CurrentPartner() ctx: PartnerContext,
    @Body() dto: MintPartnerProvisioningKeyDto,
  ) {
    return this.service.mintProvisioningKey(ctx, dto);
  }

  @Get('provisioning-keys')
  @ApiOperation({ summary: 'List provisioning keys minted by this partner' })
  listProvisioningKeys(
    @CurrentPartner() ctx: PartnerContext,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('include_inactive') includeInactive?: string,
  ) {
    return this.service.listProvisioningKeys(
      ctx,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
      includeInactive === 'true',
    );
  }

  @Delete('provisioning-keys/:provisioningKeyId')
  @ApiOperation({ summary: 'Revoke a provisioning key' })
  @ApiParam({ name: 'provisioningKeyId', type: 'string', format: 'uuid' })
  revokeProvisioningKey(
    @CurrentPartner() ctx: PartnerContext,
    @Param('provisioningKeyId', ParseUUIDPipe) provisioningKeyId: string,
  ) {
    return this.service.revokeProvisioningKey(ctx, provisioningKeyId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Partner provisioning usage summary' })
  getUsage(@CurrentPartner() ctx: PartnerContext) {
    return this.service.getUsage(ctx);
  }
}
