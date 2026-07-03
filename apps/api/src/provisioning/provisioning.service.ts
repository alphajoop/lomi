import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { ProvisioningContext } from '../core/common/guards/provisioning-key.guard';
import { ProvisioningRepository } from './provisioning.repository';
import type { CreateProvisioningAccountDto } from './dto/create-provisioning-account.dto';
import type { UploadProvisioningDocumentDto } from './dto/upload-provisioning-document.dto';
import type { ExtractProvisioningOnboardingDto } from './dto/extract-provisioning-onboarding.dto';
import type { CompleteProvisioningOnboardingDto } from './dto/complete-provisioning-onboarding.dto';
import type {
  ProvisioningAccountResponseDto,
  ProvisioningApiKeyDto,
  ProvisioningCompleteResponseDto,
  ProvisioningDocumentUploadResponseDto,
  LiveActivationRequestResponseDto,
  LiveActivationStatusResponseDto,
  ProvisioningOnboardingStatusResponseDto,
} from './dto/provisioning-response.dto';
import type { RequestLiveActivationDto } from './dto/request-live-activation.dto';

@Injectable()
export class ProvisioningService {
  constructor(
    private readonly repository: ProvisioningRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async createAccount(
    ctx: ProvisioningContext,
    dto: CreateProvisioningAccountDto,
    ipAddress?: string,
  ): Promise<ProvisioningAccountResponseDto> {
    const quota = await this.repository.checkDailyQuota(ctx.provisioningKeyId);
    if (!quota.allowed) {
      throw new ForbiddenException(quota.message);
    }

    const client = this.supabase.getClient();
    const { data, error } = await client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        full_name: dto.full_name,
        preferred_language: dto.preferred_language ?? 'fr',
        provisioned_by: ctx.partnerName,
      },
    });

    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already')) {
        throw new ConflictException('Email already in use');
      }
      throw new BadRequestException(
        error?.message || 'Failed to create merchant account',
      );
    }

    const merchantId = data.user.id;

    await this.repository.registerMerchantAccount({
      provisioningKeyId: ctx.provisioningKeyId,
      merchantId,
      termsAcceptedAt: dto.terms_accepted_at,
      termsVersion: dto.terms_version,
    });
    await this.repository.incrementDailyUsage(ctx.provisioningKeyId);
    await this.repository.logAudit({
      provisioningKeyId: ctx.provisioningKeyId,
      action: 'account_created',
      merchantId,
      ipAddress,
      metadata: {
        email: dto.email,
        terms_version: dto.terms_version,
        partner_name: ctx.partnerName,
      },
    });

    return {
      merchant_id: merchantId,
      email: dto.email,
      onboarding_status: 'pending',
      environment: ctx.environment,
    };
  }

  async uploadDocument(
    ctx: ProvisioningContext,
    merchantId: string,
    dto: UploadProvisioningDocumentDto,
    ipAddress?: string,
  ): Promise<ProvisioningDocumentUploadResponseDto> {
    await this.assertMerchantAccess(ctx, merchantId);

    const buffer = Buffer.from(dto.content_base64, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('Invalid document content');
    }
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('Document exceeds 10MB limit');
    }

    const safeName = dto.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${merchantId}/${dto.document_type}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await this.supabase
      .getClient()
      .storage.from('kyc_documents')
      .upload(filePath, buffer, {
        contentType: dto.content_type,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException(
        uploadError.message || 'Failed to upload document',
      );
    }

    const { data: publicData } = this.supabase
      .getClient()
      .storage.from('kyc_documents')
      .getPublicUrl(filePath);

    await this.repository.logAudit({
      provisioningKeyId: ctx.provisioningKeyId,
      action: 'document_uploaded',
      merchantId,
      ipAddress,
      metadata: {
        document_type: dto.document_type,
        storage_path: filePath,
      },
    });

    return {
      storage_path: filePath,
      public_url: publicData.publicUrl,
      document_type: dto.document_type,
    };
  }

  async extractOnboarding(
    ctx: ProvisioningContext,
    merchantId: string,
    dto: ExtractProvisioningOnboardingDto,
    ipAddress?: string,
  ): Promise<Record<string, unknown>> {
    await this.assertMerchantAccess(ctx, merchantId);

    if (dto.type === 'website') {
      if (!dto.website_url) {
        throw new BadRequestException('website_url is required for website extraction');
      }

      const { data, error } = await this.supabase
        .getClient()
        .functions.invoke('autofill-business-details', {
          body: {
            websiteUrl: dto.website_url,
            context: dto.website_context?.company_name
              ? { companyName: dto.website_context.company_name }
              : undefined,
          },
          headers: this.provisioningEdgeHeaders(ctx, merchantId),
        });

      if (error) {
        throw new BadRequestException(error.message || 'Website extraction failed');
      }

      await this.repository.logAudit({
        provisioningKeyId: ctx.provisioningKeyId,
        action: 'website_extracted',
        merchantId,
        ipAddress,
      });

      return (data ?? {}) as Record<string, unknown>;
    }

    if (!dto.documents?.identity_proof_path) {
      throw new BadRequestException(
        'documents.identity_proof_path is required for document extraction',
      );
    }

    const { data, error } = await this.supabase
      .getClient()
      .functions.invoke('extract-kyc-from-documents', {
        body: {
          isStarterBusiness: dto.is_starter_business ?? true,
          documents: {
            identityProofPath: dto.documents.identity_proof_path,
            businessRegistrationPath: dto.documents.business_registration_path,
            addressProofPath: dto.documents.address_proof_path,
          },
        },
        headers: this.provisioningEdgeHeaders(ctx, merchantId),
      });

    if (error) {
      throw new BadRequestException(error.message || 'Document extraction failed');
    }

    await this.repository.logAudit({
      provisioningKeyId: ctx.provisioningKeyId,
      action: 'documents_extracted',
      merchantId,
      ipAddress,
    });

    return (data ?? {}) as Record<string, unknown>;
  }

  async completeOnboarding(
    ctx: ProvisioningContext,
    merchantId: string,
    dto: CompleteProvisioningOnboardingDto,
    ipAddress?: string,
  ): Promise<ProvisioningCompleteResponseDto> {
    await this.assertMerchantAccess(ctx, merchantId);

    if (!dto.identity_proof_url?.trim()) {
      throw new BadRequestException(
        'identity_proof_url is required to complete onboarding and enable live activation review',
      );
    }

    try {
      await this.repository.completeOnboarding(merchantId, dto);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Onboarding completion failed';
      if (message.toLowerCase().includes('already in use')) {
        throw new ConflictException(message);
      }
      throw new BadRequestException(message);
    }

    const organizationId =
      await this.repository.findOrganizationIdForMerchant(merchantId);
    if (!organizationId) {
      throw new BadRequestException('Organization was not created');
    }

    await this.repository.linkOrganization(merchantId, organizationId);

    const org = await this.repository.getOrganizationVerification(organizationId);
    const kycStatus =
      (await this.repository.getKycStatus(merchantId, organizationId)) ??
      'pending';

    const keys = await this.repository.fetchApiKeys(
      ctx.provisioningKeyId,
      merchantId,
    );
    const testSecretKey = keys.find(
      (k) => k.key_type === 'secret' && k.environment === 'test',
    )?.api_key;
    const publishableKey = keys.find((k) => k.key_type === 'publishable')?.api_key;

    await this.repository.logAudit({
      provisioningKeyId: ctx.provisioningKeyId,
      action: 'onboarding_completed',
      merchantId,
      organizationId,
      ipAddress,
      metadata: {
        is_starter_business: dto.is_starter_business,
        kyc_status: kycStatus,
        test_secret_key_issued: Boolean(testSecretKey),
      },
    });

    return {
      merchant_id: merchantId,
      organization_id: organizationId,
      onboarding_status: 'completed',
      kyc_status: kycStatus,
      verification_status: org?.verification_status ?? 'unverified',
      live_activation: dto.is_starter_business
        ? 'ai_review_queued'
        : 'pending_review',
      test_secret_key: testSecretKey,
      publishable_key: publishableKey,
    };
  }

  async getOnboardingStatus(
    ctx: ProvisioningContext,
    merchantId: string,
  ): Promise<ProvisioningOnboardingStatusResponseDto> {
    const status = await this.repository.getOnboardingStatus(
      ctx.provisioningKeyId,
      merchantId,
    );

    if (!status.found) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      found: true,
      merchant_id: String(status.merchant_id),
      email: status.email as string | undefined,
      onboarded: Boolean(status.onboarded),
      onboarding_status: status.onboarding_status as string | undefined,
      organization_id: status.organization_id as string | undefined,
      verification_status: status.verification_status as string | undefined,
      kyc_status: status.kyc_status as string | undefined,
      is_starter_business: Boolean(status.is_starter_business),
      can_use_test_mode: Boolean(status.can_use_test_mode ?? true),
      can_use_live_mode: Boolean(status.can_use_live_mode),
      live_activation: status.live_activation as
        | Record<string, unknown>
        | undefined,
    };
  }

  async requestLiveActivation(
    ctx: ProvisioningContext,
    merchantId: string,
    dto: RequestLiveActivationDto,
    ipAddress?: string,
  ): Promise<LiveActivationRequestResponseDto> {
    await this.assertMerchantAccess(ctx, merchantId);

    try {
      const result = await this.repository.requestLiveActivation(
        ctx.provisioningKeyId,
        merchantId,
        dto.metadata,
      );

      await this.repository.logAudit({
        provisioningKeyId: ctx.provisioningKeyId,
        action: 'live_activation_requested',
        merchantId,
        ipAddress,
        metadata: {
          request_id: result.request_id,
          already_pending: result.already_pending,
        },
      });

      return {
        request_id: String(result.request_id),
        status: String(result.status),
        merchant_approval_path: String(result.merchant_approval_path),
        already_pending: Boolean(result.already_pending),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Live activation request failed';
      throw new BadRequestException(message);
    }
  }

  async getLiveActivationStatus(
    ctx: ProvisioningContext,
    merchantId: string,
  ): Promise<LiveActivationStatusResponseDto> {
    await this.assertMerchantAccess(ctx, merchantId);

    const status = await this.repository.getLiveActivationStatus(
      ctx.provisioningKeyId,
      merchantId,
    );

    if (!status.found) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      found: true,
      organization_id: status.organization_id as string | undefined,
      verification_status: status.verification_status as string | undefined,
      can_use_live_mode: Boolean(status.can_use_live_mode),
      request: (status.request as Record<string, unknown> | null) ?? null,
    };
  }

  async getApiKeys(
    ctx: ProvisioningContext,
    merchantId: string,
    ipAddress?: string,
  ): Promise<ProvisioningApiKeyDto[]> {
    const keys = await this.repository.fetchApiKeys(
      ctx.provisioningKeyId,
      merchantId,
    );

    await this.repository.logAudit({
      provisioningKeyId: ctx.provisioningKeyId,
      action: 'api_keys_retrieved',
      merchantId,
      ipAddress,
    });

    return keys;
  }

  private async assertMerchantAccess(
    ctx: ProvisioningContext,
    merchantId: string,
  ): Promise<void> {
    const allowed = await this.repository.verifyMerchantAccess(
      ctx.provisioningKeyId,
      merchantId,
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied for merchant');
    }
  }

  private provisioningEdgeHeaders(
    ctx: ProvisioningContext,
    merchantId: string,
  ): Record<string, string> {
    return {
      'x-lomi-provisioning-merchant-id': merchantId,
      'x-lomi-provisioning-key-id': ctx.provisioningKeyId,
    };
  }
}
