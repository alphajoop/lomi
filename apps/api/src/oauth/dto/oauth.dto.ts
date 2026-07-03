import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OAuthConsentDto {
  @ApiProperty()
  @IsString()
  client_id!: string;

  @ApiProperty()
  @IsString()
  redirect_uri!: string;

  @ApiProperty({ default: 'code' })
  @IsString()
  response_type!: string;

  @ApiProperty()
  @IsString()
  code_challenge!: string;

  @ApiPropertyOptional({ default: 'S256' })
  @IsOptional()
  @IsString()
  code_challenge_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiProperty()
  @IsBoolean()
  approved!: boolean;
}

export class OAuthRegisterClientDto {
  @ApiProperty()
  @IsString()
  client_name!: string;

  @ApiProperty({ type: [String] })
  redirect_uris!: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  grant_types?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  response_types?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token_endpoint_auth_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;
}
