import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';

@Injectable()
export class DisputesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(
    user: AuthContext,
    status?: string,
    page = 1,
    pageSize = 50,
    startDate?: string,
    endDate?: string,
  ) {
    const { data, error } = await this.supabaseService.rpc(
      'fetch_disputes' as never,
      {
        p_organization_id: user.organizationId,
        p_page: page,
        p_page_size: pageSize,
        p_status: status ?? null,
        p_start_date: startDate ?? null,
        p_end_date: endDate ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, data: data ?? [] };
  }

  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabaseService.rpc(
      'get_dispute_api' as never,
      {
        p_dispute_id: id,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      throw new NotFoundException('Dispute not found');
    }

    return { success: true, data: rows[0] };
  }
}
