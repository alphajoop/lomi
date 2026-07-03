import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProvisioningAccountResponseDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  merchant_id: string;

  @ApiProperty({ type: String, example: 'merchant@example.com' })
  email: string;

  @ApiProperty({ type: String, example: 'pending' })
  onboarding_status: string;

  @ApiProperty({ type: String, example: 'test', enum: ['test', 'live'] })
  environment: string;
}

export class ProvisioningDocumentUploadResponseDto {
  @ApiProperty()
  storage_path: string;

  @ApiProperty()
  public_url: string;

  @ApiProperty()
  document_type: string;
}

export class ProvisioningApiKeyDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  api_key: string;

  @ApiProperty()
  key_type: string;

  @ApiProperty()
  environment: string;

  @ApiProperty()
  is_active: boolean;
}

export class ProvisioningOnboardingStatusResponseDto {
  @ApiProperty()
  found: boolean;

  @ApiPropertyOptional()
  merchant_id?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  onboarded?: boolean;

  @ApiPropertyOptional()
  onboarding_status?: string;

  @ApiPropertyOptional()
  organization_id?: string;

  @ApiPropertyOptional()
  verification_status?: string;

  @ApiPropertyOptional()
  kyc_status?: string;

  @ApiPropertyOptional()
  is_starter_business?: boolean;

  @ApiProperty()
  can_use_test_mode: boolean;

  @ApiProperty()
  can_use_live_mode: boolean;

  @ApiPropertyOptional()
  live_activation?: Record<string, unknown>;
}

export class LiveActivationRequestResponseDto {
  @ApiProperty()
  request_id!: string;

  @ApiProperty({
    enum: [
      'pending_merchant',
      'pending_review',
      'approved',
      'rejected',
      'expired',
    ],
  })
  status!: string;

  @ApiProperty()
  merchant_approval_path!: string;

  @ApiPropertyOptional()
  already_pending?: boolean;
}

export class LiveActivationStatusResponseDto {
  @ApiProperty()
  found!: boolean;

  @ApiPropertyOptional()
  organization_id?: string;

  @ApiPropertyOptional()
  verification_status?: string;

  @ApiProperty()
  can_use_live_mode!: boolean;

  @ApiPropertyOptional()
  request?: Record<string, unknown> | null;
}

export class ProvisioningCompleteResponseDto {
  @ApiProperty()
  merchant_id: string;

  @ApiProperty()
  organization_id: string;

  @ApiProperty()
  onboarding_status: string;

  @ApiProperty()
  kyc_status: string;

  @ApiProperty()
  verification_status: string;

  @ApiProperty({
    enum: ['pending_review', 'ai_review_queued'],
    description:
      'Starter accounts may reach LIVE via AI review; registered businesses require admin approval.',
  })
  live_activation: 'pending_review' | 'ai_review_queued';

  @ApiPropertyOptional({
    type: String,
    description:
      'The organization test secret key (lomi_sk_test_*). Use it as x-lomi-api-key to drive the full REST API in TEST mode immediately.',
  })
  test_secret_key?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'The organization live publishable key (lomi_pk_*).',
  })
  publishable_key?: string;
}
