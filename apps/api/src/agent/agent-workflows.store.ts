import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';

export type WorkflowRun = {
  run_id: string;
  organization_id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: { id: string; status: string }[];
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};

type WorkflowRow = {
  run_id: string;
  organization_id: string;
  name: string;
  status: WorkflowRun['status'];
  steps: WorkflowRun['steps'];
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class AgentWorkflowsStore {
  constructor(private readonly supabase: SupabaseService) {}

  private mapRow(row: WorkflowRow): WorkflowRun {
    return {
      run_id: row.run_id,
      organization_id: row.organization_id,
      name: row.name,
      status: row.status,
      steps: Array.isArray(row.steps) ? row.steps : [],
      idempotency_key: row.idempotency_key,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private firstRow(data: unknown): WorkflowRow | null {
    const rows = (data ?? []) as WorkflowRow[];
    return rows[0] ?? null;
  }

  async create(
    organizationId: string,
    input: { name: string; steps: { id: string }[]; idempotency_key?: string },
  ): Promise<WorkflowRun> {
    const { data, error } = await this.supabase.rpc(
      'create_agent_workflow_run' as never,
      {
        p_organization_id: organizationId,
        p_name: input.name,
        p_steps: input.steps,
        p_idempotency_key: input.idempotency_key ?? null,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = this.firstRow(data);
    if (!row) {
      throw new InternalServerErrorException('Failed to create workflow run');
    }

    return this.mapRow(row);
  }

  async get(organizationId: string, runId: string): Promise<WorkflowRun> {
    const { data, error } = await this.supabase.rpc(
      'get_agent_workflow_run' as never,
      {
        p_organization_id: organizationId,
        p_run_id: runId,
      } as never,
    );

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const row = this.firstRow(data);
    if (!row) {
      throw new NotFoundException('Workflow run not found');
    }

    return this.mapRow(row);
  }

  async updateStep(
    organizationId: string,
    runId: string,
    stepId: string,
    status: string,
  ): Promise<WorkflowRun> {
    const { data, error } = await this.supabase.rpc(
      'update_agent_workflow_run_step' as never,
      {
        p_organization_id: organizationId,
        p_run_id: runId,
        p_step_id: stepId,
        p_status: status,
      } as never,
    );

    if (error) {
      if (error.message.includes('workflow_run_not_found')) {
        throw new NotFoundException('Workflow run not found');
      }
      if (error.message.includes('workflow_step_not_found')) {
        throw new NotFoundException(`Step ${stepId} not found in run`);
      }
      throw new InternalServerErrorException(error.message);
    }

    const row = this.firstRow(data);
    if (!row) {
      throw new NotFoundException('Workflow run not found');
    }

    return this.mapRow(row);
  }
}
