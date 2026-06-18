import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { throwMappedSupabaseRpcError } from '../../utils/supabase-rpc-errors';
import {
  lookupIdempotencyCache,
  type IdempotentCreateResult,
} from '../../utils/idempotency-cache';

export type PaymentRequestIdempotencyContext = {
  key: string;
  bodyHash: string;
};

@Injectable()
export class PaymentRequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a payment request
   * Uses RPC: create_payment_request_api
   */
  async create(
    createDto: CreatePaymentRequestDto,
    user: AuthContext,
    idempotency?: PaymentRequestIdempotencyContext,
  ): Promise<IdempotentCreateResult<unknown>> {
    if (idempotency) {
      const cached = await lookupIdempotencyCache(this.supabase, {
        organizationId: user.organizationId,
        environment: user.environment || 'live',
        endpointRoute: 'POST:/payment-requests',
        key: idempotency.key,
        bodyHash: idempotency.bodyHash,
      });
      if (cached.kind === 'hit') {
        return { data: cached.payload, idempotencyCacheHit: true };
      }
    }

    const rpcArgs = {
      p_organization_id: user.organizationId,
      p_customer_id: createDto.customer_id || null,
      p_amount: createDto.amount,
      p_currency_code: createDto.currency_code,
      p_description: createDto.description || null,
      p_expiry_date: createDto.expiry_date,
      p_payment_reference: createDto.payment_reference || null,
      p_created_by: user.merchantId,
      p_environment: user.environment || 'live',
      ...(idempotency
        ? {
            p_idempotency_key: idempotency.key,
            p_idempotency_body_hash: idempotency.bodyHash,
          }
        : {}),
    };

    const { data, error } = await this.supabase
      .getClient()
      .rpc('create_payment_request_api', rpcArgs as never);

    if (error) throwMappedSupabaseRpcError(error.message);

    if (!data) {
      throw new Error('Failed to create payment request');
    }

    const dataArray = Array.isArray(data) ? data : [data];
    if (dataArray.length === 0) {
      throw new Error('Failed to create payment request');
    }

    return { data: dataArray[0] };
  }

  /**
   * List all payment requests with filtering
   * Uses RPC: list_payment_requests
   */
  async findAll(
    user: AuthContext,
    status?: string,
    customerId?: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    // Validate customerId is a valid UUID if provided
    let validatedCustomerId: string | null = null;
    if (customerId) {
      // Basic UUID validation
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customerId)) {
        throw new BadRequestException(
          `Invalid customer ID format: ${customerId}`,
        );
      }
      validatedCustomerId = customerId;
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'list_payment_requests' as any,
      {
        p_organization_id: user.organizationId,
        p_status: status || null,
        p_customer_id: validatedCustomerId,
        p_limit: limit,
        p_offset: offset,
      } as any,
    );

    if (error) {
      console.error('list_payment_requests RPC error:', error);
      throw new InternalServerErrorException(
        `Failed to fetch payment requests: ${error.message}`,
      );
    }

    const requests = (data as any[]) || [];

    return {
      data: requests,
      total: requests.length, // RPC doesn't return count, approximate with length
      limit,
      offset,
    };
  }

  /**
   * Get single payment request by ID
   */
  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_payment_request_api' as any,
      {
        p_request_id: id,
        p_organization_id: user.organizationId,
      } as any,
    );

    const dataArray = Array.isArray(data) ? data : [data];
    const request = dataArray[0];

    if (error || !request) {
      throw new NotFoundException(
        `Payment request with ID ${id} not found or access denied`,
      );
    }

    return request;
  }
}
