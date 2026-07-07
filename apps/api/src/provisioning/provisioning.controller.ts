import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProvisioningKeyGuard } from '../core/common/guards/provisioning-key.guard';
import { CurrentProvisioning } from './decorators/current-provisioning.decorator';
import type { ProvisioningContext } from '../core/common/guards/provisioning-key.guard';
import { CreateProvisioningAccountDto } from './dto/create-provisioning-account.dto';
import { UploadProvisioningDocumentDto } from './dto/upload-provisioning-document.dto';
import { ExtractProvisioningOnboardingDto } from './dto/extract-provisioning-onboarding.dto';
import { CompleteProvisioningOnboardingDto } from './dto/complete-provisioning-onboarding.dto';
import { RequestLiveActivationDto } from './dto/request-live-activation.dto';
import { ProvisioningService } from './provisioning.service';

@ApiTags('Provisioning')
@ApiSecurity('provisioning-key')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UseGuards(ProvisioningKeyGuard)
@Controller('provisioning/v1')
export class ProvisioningController {
  constructor(private readonly service: ProvisioningService) {}

  @Post('accounts')
  @ApiOperation({
    summary: 'Create a merchant account for agent-driven onboarding',
    description:
      'Creates a Supabase auth user and merchant record. Requires terms acceptance metadata.',
  })
  createAccount(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Body() dto: CreateProvisioningAccountDto,
    @Req() req: Request,
  ) {
    return this.service.createAccount(ctx, dto, req.ip);
  }

  @Post('merchants/:merchantId/onboarding/documents')
  @ApiOperation({ summary: 'Upload a KYC document for onboarding' })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  uploadDocument(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
    @Body() dto: UploadProvisioningDocumentDto,
    @Req() req: Request,
  ) {
    return this.service.uploadDocument(ctx, merchantId, dto, req.ip);
  }

  @Post('merchants/:merchantId/onboarding/extract')
  @ApiOperation({
    summary: 'Extract onboarding data from website or uploaded documents',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  extractOnboarding(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
    @Body() dto: ExtractProvisioningOnboardingDto,
    @Req() req: Request,
  ): Promise<Record<string, unknown>> {
    return this.service.extractOnboarding(ctx, merchantId, dto, req.ip);
  }

  @Post('merchants/:merchantId/onboarding/complete')
  @ApiOperation({
    summary: 'Complete merchant onboarding and submit KYC',
    description:
      'Atomically creates the organization, provisions test API keys, and queues KYC review.',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  completeOnboarding(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
    @Body() dto: CompleteProvisioningOnboardingDto,
    @Req() req: Request,
  ) {
    return this.service.completeOnboarding(ctx, merchantId, dto, req.ip);
  }

  @Get('merchants/:merchantId/onboarding/status')
  @ApiOperation({
    summary: 'Get onboarding, KYC, and verification status',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  getOnboardingStatus(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
  ) {
    return this.service.getOnboardingStatus(ctx, merchantId);
  }

  @Get('merchants/:merchantId/api-keys')
  @ApiOperation({
    summary: 'Retrieve provisioned test API keys for the merchant',
    description:
      'Returns test secret keys and publishable keys after onboarding completes.',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  getApiKeys(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
    @Req() req: Request,
  ) {
    return this.service.getApiKeys(ctx, merchantId, req.ip);
  }

  @Post('merchants/:merchantId/live-activation/request')
  @ApiOperation({
    summary: 'Request live mode activation (requires merchant approval)',
    description:
      'Creates a live activation request. The merchant must approve on the dashboard before platform review. Live secret keys are never returned via provisioning.',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  requestLiveActivation(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
    @Body() dto: RequestLiveActivationDto,
    @Req() req: Request,
  ) {
    return this.service.requestLiveActivation(ctx, merchantId, dto, req.ip);
  }

  @Get('merchants/:merchantId/live-activation/status')
  @ApiOperation({
    summary: 'Get live activation request status',
    description:
      'Poll until approved. When live_keys_available is true, the merchant must retrieve the live secret key from the dashboard; not via this API.',
  })
  @ApiParam({ name: 'merchantId', type: 'string', format: 'uuid' })
  getLiveActivationStatus(
    @CurrentProvisioning() ctx: ProvisioningContext,
    @Param('merchantId', ParseUUIDPipe) merchantId: string,
  ) {
    return this.service.getLiveActivationStatus(ctx, merchantId);
  }
}
