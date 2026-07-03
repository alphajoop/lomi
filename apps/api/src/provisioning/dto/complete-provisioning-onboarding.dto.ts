import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CompleteProvisioningOnboardingDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  first_name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  last_name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  phone_number!: string;

  @ApiProperty({ example: 'SN' })
  @IsString()
  @MinLength(2)
  country!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  org_name!: string;

  @ApiProperty()
  @IsEmail()
  org_email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_phone_number?: string;

  @ApiProperty()
  @IsString()
  org_country!: string;

  @ApiProperty()
  @IsString()
  org_region!: string;

  @ApiProperty()
  @IsString()
  org_city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_postal_code?: string;

  @ApiProperty()
  @IsString()
  org_industry!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_website_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_employee_number?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  preferred_language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty()
  @IsString()
  organization_position!: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  is_starter_business!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_authorized_signatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proof_of_business?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proof_of_business_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identity_proof_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatory_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  signatory_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_proof_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_registration_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tax_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_organization_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  document_extraction?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id_document_number?: string;
}
