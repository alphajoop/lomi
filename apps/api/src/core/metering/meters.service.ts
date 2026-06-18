import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { Json } from '../../utils/types/api';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';

@Injectable()
export class MetersService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateMeterDto, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'create_meter' as never,
      {
        p_organization_id: user.organizationId,
        p_name: dto.name,
        p_product_id: dto.product_id ?? null,
        p_filter: (dto.filter ?? {}) as Json,
        p_aggregation: (dto.aggregation ?? {
          type: 'sum',
          property: 'quantity',
        }) as Json,
      } as never,
    );

    if (error) throw new Error(error.message);
    return this.findOne(data as string, user);
  }

  async findAll(user: AuthContext, productId?: string, isActive?: boolean) {
    const { data, error } = await this.supabase.getClient().rpc(
      'list_meters_api' as never,
      {
        p_organization_id: user.organizationId,
        p_product_id: productId ?? null,
        p_is_active: isActive ?? null,
      } as never,
    );

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_meter_api' as never,
      {
        p_meter_id: id,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) throw new Error(error.message);
    if (!data) {
      throw new NotFoundException(`Meter with ID ${id} not found`);
    }

    return data;
  }

  async getBalance(meterId: string, customerId: string, user: AuthContext) {
    await this.findOne(meterId, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'get_meter_balance_api' as never,
      {
        p_meter_id: meterId,
        p_organization_id: user.organizationId,
        p_customer_id: customerId,
      } as never,
    );

    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return {
        meter_id: meterId,
        customer_id: customerId,
        consumed_units: 0,
        credited_units: 0,
        balance: 0,
      };
    }

    return row;
  }

  async update(id: string, dto: UpdateMeterDto, user: AuthContext) {
    await this.findOne(id, user);

    const { error } = await this.supabase.getClient().rpc(
      'update_meter_api' as never,
      {
        p_meter_id: id,
        p_organization_id: user.organizationId,
        p_filter: dto.filter !== undefined ? (dto.filter as Json) : null,
        p_aggregation:
          dto.aggregation !== undefined ? (dto.aggregation as Json) : null,
        p_is_active: dto.is_active ?? null,
      } as never,
    );

    if (error) throw new Error(error.message);
    return this.findOne(id, user);
  }
}
