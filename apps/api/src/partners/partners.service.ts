import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PartnerContext } from '../core/common/guards/partner-key.guard';
import type { MintPartnerProvisioningKeyDto } from './dto/mint-partner-provisioning-key.dto';
import { PartnersRepository } from './partners.repository';

@Injectable()
export class PartnersService {
  constructor(private readonly repository: PartnersRepository) {}

  async mintProvisioningKey(
    ctx: PartnerContext,
    dto: MintPartnerProvisioningKeyDto,
  ) {
    try {
      const row = await this.repository.mintProvisioningKey({
        partnerId: ctx.partnerId,
        name: dto.name,
        externalUserRef: dto.external_user_ref,
        environment: dto.environment ?? 'test',
      });
      return {
        provisioning_key_id: row.provisioning_key_id,
        provisioning_key: row.provisioning_key,
        name: row.name,
        partner_name: row.partner_name,
        environment: row.environment,
        external_user_ref: row.external_user_ref,
        key_kind: row.key_kind,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to mint provisioning key';
      throw new BadRequestException(message);
    }
  }

  listProvisioningKeys(
    ctx: PartnerContext,
    limit = 50,
    offset = 0,
    includeInactive = false,
  ) {
    return this.repository.listProvisioningKeys(
      ctx.partnerId,
      limit,
      offset,
      includeInactive,
    );
  }

  async revokeProvisioningKey(ctx: PartnerContext, provisioningKeyId: string) {
    const revoked = await this.repository.revokeProvisioningKey(
      ctx.partnerId,
      provisioningKeyId,
    );
    if (!revoked) {
      throw new NotFoundException('Provisioning key not found');
    }
    return { revoked: true, provisioning_key_id: provisioningKeyId };
  }

  getUsage(ctx: PartnerContext) {
    return this.repository.getUsageSummary(ctx.partnerId);
  }
}
