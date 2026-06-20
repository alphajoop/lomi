import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';

export type AgentSubscriptionRecord = {
  subscription_id: string;
  organization_id: string;
  topics: string[];
  channel: 'sse' | 'webhook' | 'pull';
  webhook_url?: string;
  created_at: string;
};

type SubscriptionRow = {
  subscription_id: string;
  organization_id: string;
  topics: string[];
  channel: AgentSubscriptionRecord['channel'];
  webhook_url: string | null;
  created_at: string;
};

@Injectable()
export class AgentSubscriptionsStore {
  constructor(private readonly supabase: SupabaseService) {}

  private mapRow(row: SubscriptionRow): AgentSubscriptionRecord {
    return {
      subscription_id: row.subscription_id,
      organization_id: row.organization_id,
      topics: row.topics ?? [],
      channel: row.channel,
      webhook_url: row.webhook_url ?? undefined,
      created_at: row.created_at,
    };
  }

  async create(
    organizationId: string,
    input: {
      topics: string[];
      channel: AgentSubscriptionRecord['channel'];
      webhook_url?: string;
    },
  ): Promise<AgentSubscriptionRecord> {
    const { data, error } = await this.supabase.rpc(
      'create_agent_event_subscription' as never,
      {
        p_organization_id: organizationId,
        p_topics: [...new Set(input.topics)],
        p_channel: input.channel,
        p_webhook_url: input.webhook_url ?? null,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = ((data ?? []) as SubscriptionRow[])[0];
    if (!row) {
      throw new InternalServerErrorException('Failed to create subscription');
    }

    return this.mapRow(row);
  }

  async list(organizationId: string): Promise<AgentSubscriptionRecord[]> {
    const { data, error } = await this.supabase.rpc(
      'list_agent_event_subscriptions' as never,
      { p_organization_id: organizationId } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return ((data ?? []) as SubscriptionRow[]).map((row) => this.mapRow(row));
  }

  async get(
    organizationId: string,
    id: string,
  ): Promise<AgentSubscriptionRecord | undefined> {
    const { data, error } = await this.supabase.rpc(
      'get_agent_event_subscription' as never,
      {
        p_organization_id: organizationId,
        p_subscription_id: id,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = ((data ?? []) as SubscriptionRow[])[0];
    if (!row) return undefined;
    return this.mapRow(row);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      'delete_agent_event_subscription' as never,
      {
        p_organization_id: organizationId,
        p_subscription_id: id,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return Boolean(data);
  }
}
