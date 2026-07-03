import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProvisioningDocumentPathsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  identity_proof_path!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_registration_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_proof_path?: string;
}

class ProvisioningWebsiteContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company_name?: string;
}

export class ExtractProvisioningOnboardingDto {
  @ApiProperty({ enum: ['website', 'documents'] })
  @IsIn(['website', 'documents'])
  type!: 'website' | 'documents';

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  website_url?: string;

  @ApiPropertyOptional({ type: ProvisioningWebsiteContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisioningWebsiteContextDto)
  website_context?: ProvisioningWebsiteContextDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_starter_business?: boolean;

  @ApiPropertyOptional({ type: ProvisioningDocumentPathsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisioningDocumentPathsDto)
  documents?: ProvisioningDocumentPathsDto;
}
