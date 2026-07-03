import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class UploadProvisioningDocumentDto {
  @ApiProperty({
    enum: ['identity', 'business_registration', 'address_proof'],
  })
  @IsIn(['identity', 'business_registration', 'address_proof'])
  document_type!: 'identity' | 'business_registration' | 'address_proof';

  @ApiProperty({
    description: 'Base64-encoded file contents',
  })
  @IsString()
  @MinLength(1)
  content_base64!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MinLength(1)
  content_type!: string;

  @ApiProperty({ example: 'national-id.jpg' })
  @IsString()
  @MinLength(1)
  file_name!: string;
}
