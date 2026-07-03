import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../utils/supabase/supabase.service';

export interface ProvisioningContext {
  provisioningKey: string;
  provisioningKeyId: string;
  partnerName: string;
  environment: 'test' | 'live';
}

@Injectable()
export class ProvisioningKeyGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provisioningKey = this.extractProvisioningKey(request);

    if (!provisioningKey) {
      throw new UnauthorizedException('Provisioning key is missing');
    }

    const { data, error } = await this.supabase.rpc(
      'verify_provisioning_key' as any,
      {
        p_provisioning_key: provisioningKey,
        p_endpoint: request.url,
        p_ip_address: request.ip,
      } as any,
    );

    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          is_valid: boolean;
          provisioning_key_id: string;
          partner_name: string;
          environment: string;
          message?: string;
        }
      | undefined;
    if (error || !row?.is_valid) {
      throw new UnauthorizedException(row?.message || 'Invalid provisioning key');
    }

    request.provisioning = {
      provisioningKey,
      provisioningKeyId: row.provisioning_key_id,
      partnerName: row.partner_name,
      environment: row.environment === 'live' ? 'live' : 'test',
    } satisfies ProvisioningContext;

    return true;
  }

  private extractProvisioningKey(request: {
    headers: Record<string, string | string[] | undefined>;
    authorization?: string;
  }): string | undefined {
    const header = request.headers['x-lomi-provisioning-key'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }

    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token.startsWith('lomi_prov_')) {
        return token;
      }
    }

    return undefined;
  }
}
