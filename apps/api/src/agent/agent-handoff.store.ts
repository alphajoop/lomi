import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';

export type HandoffRecord = {
  handoff_id: string;
  organization_id: string;
  to: string;
  task: string;
  context: Record<string, unknown>;
  trace_id: string | null;
  status: 'accepted' | 'pending';
  created_at: string;
};

type HandoffRow = {
  handoff_id: string;
  organization_id: string;
  to_agent: string;
  task: string;
  context: Record<string, unknown>;
  trace_id: string | null;
  status: HandoffRecord['status'];
  created_at: string;
};

@Injectable()
export class AgentHandoffStore {
  constructor(private readonly supabase: SupabaseService) {}

  private mapRow(row: HandoffRow): HandoffRecord {
    return {
      handoff_id: row.handoff_id,
      organization_id: row.organization_id,
      to: row.to_agent,
      task: row.task,
      context: row.context ?? {},
      trace_id: row.trace_id,
      status: row.status,
      created_at: row.created_at,
    };
  }

  async create(
    organizationId: string,
    input: {
      to: string;
      task: string;
      context: Record<string, unknown>;
      trace_id?: string;
    },
  ): Promise<HandoffRecord> {
    const { data, error } = await this.supabase.rpc(
      'create_agent_handoff' as never,
      {
        p_organization_id: organizationId,
        p_to_agent: input.to,
        p_task: input.task,
        p_context: input.context,
        p_trace_id: input.trace_id ?? null,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = ((data ?? []) as HandoffRow[])[0];
    if (!row) {
      throw new InternalServerErrorException('Failed to create handoff');
    }

    return this.mapRow(row);
  }

  async get(
    organizationId: string,
    id: string,
  ): Promise<HandoffRecord | undefined> {
    const { data, error } = await this.supabase.rpc(
      'get_agent_handoff' as never,
      {
        p_organization_id: organizationId,
        p_handoff_id: id,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = ((data ?? []) as HandoffRow[])[0];
    if (!row) return undefined;
    return this.mapRow(row);
  }
}
