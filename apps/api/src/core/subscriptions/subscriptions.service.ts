import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * List all subscriptions for merchant's organization
   * Uses RPC: fetch_subscriptions
   */
  async findAll(user: AuthContext, page: number = 1, pageSize: number = 50) {
    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_subscriptions' as any,
      {
        p_organization_id: user.organizationId,
        p_merchant_id: user.merchantId,
        p_page: page,
        p_page_size: pageSize,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || [];
  }

  /**
   * Get single subscription by ID
   * Uses RPC: get_customer_subscription
   */
  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_customer_subscription' as any,
      {
        p_subscription_id: id,
        p_merchant_id: user.merchantId,
      } as any,
    );

    if (error) throw new Error(error.message);

    const subscription = data as any;

    if (!subscription || !subscription.subscription_id) {
      throw new NotFoundException(
        `Subscription with ID ${id} not found or access denied`,
      );
    }

    // Validate ownership
    if (subscription.organization_id !== user.organizationId) {
      throw new NotFoundException(
        `Subscription with ID ${id} not found or access denied`,
      );
    }

    return subscription;
  }

  /**
   * Cancel a subscription
   * Uses RPC: cancel_customer_subscription
   *
   * This is the ONLY modification allowed on subscriptions.
   * Fields like price_id, next_billing_date, start_date are system-managed.
   *
   * Note: cancellation_reason is accepted but currently only logged.
   * Future enhancement: Store in audit log or metadata table.
   */
  async update(
    id: string,
    updateDto: UpdateSubscriptionDto,
    user: AuthContext,
  ) {
    await this.findOne(id, user);

    const { data: updated, error } = await this.supabase.getClient().rpc(
      'update_customer_subscription' as never,
      {
        p_subscription_id: id,
        p_merchant_id: user.merchantId,
        p_status: updateDto.status ?? null,
        p_start_date: updateDto.start_date ?? null,
        p_end_date: updateDto.end_date ?? null,
        p_next_billing_date: updateDto.next_billing_date ?? null,
        p_metadata: updateDto.metadata ?? null,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }
    if (!updated) {
      throw new NotFoundException(
        `Subscription with ID ${id} not found or update failed`,
      );
    }

    return this.findOne(id, user);
  }

  async cancel(
    id: string,
    cancelDto: CancelSubscriptionDto,
    user: AuthContext,
  ) {
    await this.findOne(id, user);

    const { error } = await this.supabase.getClient().rpc(
      'cancel_customer_subscription' as never,
      {
        p_subscription_id: id,
        p_merchant_id: user.merchantId,
        p_cancel_at_period_end: cancelDto.cancel_at_period_end ?? false,
        p_cancellation_reason: cancelDto.cancellation_reason ?? null,
      } as never,
    );

    if (error) throw new Error(error.message);

    return this.findOne(id, user);
  }

  async uncancel(id: string, user: AuthContext) {
    await this.findOne(id, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'manage_subscription' as never,
      {
        p_subscription_id: id,
        p_action: 'uncancel',
        p_actor: 'merchant',
        p_source: 'merchant_api',
        p_merchant_id: user.merchantId,
      } as never,
    );

    if (error) throw new BadRequestException(error.message);

    const result = data as { ok?: boolean };
    if (!result?.ok) {
      throw new BadRequestException('Failed to uncancel subscription');
    }

    return this.findOne(id, user);
  }

  async changePlan(id: string, priceId: string, user: AuthContext) {
    await this.findOne(id, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'manage_subscription' as never,
      {
        p_subscription_id: id,
        p_action: 'change_plan',
        p_actor: 'merchant',
        p_source: 'merchant_api',
        p_merchant_id: user.merchantId,
        p_new_price_id: priceId,
      } as never,
    );

    if (error) throw new BadRequestException(error.message);

    const result = data as { ok?: boolean };
    if (!result?.ok) {
      throw new BadRequestException('Failed to change subscription plan');
    }

    return this.findOne(id, user);
  }

  /**
   * Get subscriptions for a specific customer
   * Uses RPC: fetch_subscriptions_for_customer
   */
  async findByCustomer(customerId: string, user: AuthContext) {
    // First verify the customer belongs to this organization
    const { data: customer, error: customerError } = await this.supabase
      .getClient()
      .rpc(
        'get_customer_by_organization' as any,
        {
          p_customer_id: customerId,
          p_organization_id: user.organizationId,
        } as any,
      );

    const customerRow = Array.isArray(customer) ? customer[0] : customer;

    if (customerError || !customerRow) {
      throw new NotFoundException(
        `Customer with ID ${customerId} not found or access denied`,
      );
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_subscriptions_for_customer' as any,
      {
        p_customer_id: customerId,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || [];
  }
}
