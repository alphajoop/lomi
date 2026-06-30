import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import {
  LogSeverity,
  LogType,
  LOG_SEVERITIES,
} from './logs.types';
import { LogEntryResponseDto } from './dto/log-entry-response.dto';
import { LogListResponseDto } from './dto/log-list-response.dto';

/**
 * Merchant log reads go through Supabase RPCs only (no direct table queries).
 * API key material is masked in SQL before persistence and again in mappers here.
 */

export interface ListLogsParams {
  type: LogType;
  limit: number;
  offset: number;
  startDate?: string;
  endDate?: string;
  status?: number[];
  severity?: string;
  webhookId?: string;
  successOnly?: boolean;
  failedOnly?: boolean;
  event?: string;
}

function maskApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null;
  if (apiKey.length <= 12) return `${apiKey.slice(0, 4)}****`;
  return `${apiKey.slice(0, 8)}****`;
}

function severityFromHttpStatus(status: number | null | undefined): LogSeverity {
  if (status == null) return 'info';
  if (status >= 500) return 'error';
  if (status >= 400) return 'warning';
  return 'info';
}

function severityFromActivity(
  severity: string | null | undefined,
): LogSeverity {
  switch ((severity ?? '').toUpperCase()) {
    case 'CRITICAL':
      return 'critical';
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
}

function severityFromApiError(
  errorType: string,
  responseStatus: number | null | undefined,
): LogSeverity {
  if (errorType.toLowerCase().includes('critical')) return 'critical';
  if (responseStatus != null && responseStatus >= 500) return 'error';
  if (
    responseStatus != null &&
    responseStatus >= 400 &&
    responseStatus < 500
  ) {
    return 'warning';
  }
  if (errorType.toLowerCase().includes('rate_limit')) return 'warning';
  return 'error';
}

function activitySeverityToDb(severity: string): string | null {
  switch (severity) {
    case 'info':
      return 'NOTICE';
    case 'warning':
      return 'WARNING';
    case 'error':
      return 'ERROR';
    case 'critical':
      return 'CRITICAL';
    default:
      return null;
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled log type: ${String(value)}`);
}

@Injectable()
export class LogsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(
    user: AuthContext,
    params: ListLogsParams,
  ): Promise<LogListResponseDto> {
    const { type, limit, offset } = params;
    const environment = user.environment ?? 'live';

    switch (type) {
      case 'api_request':
        return this.listApiRequests(user, params, environment);
      case 'api_error':
        return this.listApiErrors(user, params);
      case 'webhook_delivery':
        return this.listWebhookDeliveries(user, params, environment);
      case 'activity':
        return this.listActivity(user, params);
      default:
        return assertNever(type);
    }
  }

  async findOne(
    user: AuthContext,
    type: LogType,
    id: string,
  ): Promise<LogEntryResponseDto> {
    const environment = user.environment ?? 'live';

    switch (type) {
      case 'api_request':
        return this.findApiRequest(user, id, environment);
      case 'api_error':
        return this.findApiError(user, id);
      case 'webhook_delivery':
        return this.findWebhookDelivery(user, id, environment);
      case 'activity':
        return this.findActivity(user, id);
      default:
        return assertNever(type);
    }
  }

  private buildListResponse(
    type: LogType,
    entries: LogEntryResponseDto[],
    totalCount: number,
    limit: number,
    offset: number,
  ): LogListResponseDto {
    return {
      object: 'list',
      type,
      data: entries,
      total_count: totalCount,
      limit,
      offset,
      has_more: offset + entries.length < totalCount,
    };
  }

  private async listApiRequests(
    user: AuthContext,
    params: ListLogsParams,
    environment: string,
  ): Promise<LogListResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_api_request_logs' as never,
      {
        p_organization_id: user.organizationId,
        p_status_codes:
          params.status && params.status.length > 0 ? params.status : null,
        p_start_date: params.startDate ?? null,
        p_end_date: params.endDate ?? null,
        p_limit: params.limit,
        p_offset: params.offset,
        p_environment: environment,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const totalCount = Number(rows[0]?.total_count ?? 0);
    const entries = rows.map((row) => this.mapApiRequestRow(row));

    return this.buildListResponse(
      'api_request',
      entries,
      totalCount,
      params.limit,
      params.offset,
    );
  }

  private async findApiRequest(
    user: AuthContext,
    id: string,
    environment: string,
  ): Promise<LogEntryResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_api_request_log' as never,
      {
        p_interaction_id: id,
        p_organization_id: user.organizationId,
        p_environment: environment,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Log with ID ${id} not found or access denied`,
      );
    }

    return this.mapApiRequestRow(row);
  }

  private mapApiRequestRow(row: Record<string, unknown>): LogEntryResponseDto {
    const statusCode =
      typeof row.response_status === 'number' ? row.response_status : null;

    return {
      id: String(row.interaction_id),
      type: 'api_request',
      timestamp: String(row.created_at),
      severity: severityFromHttpStatus(statusCode),
      status_code: statusCode,
      method:
        typeof row.request_method === 'string' ? row.request_method : null,
      endpoint: typeof row.endpoint === 'string' ? row.endpoint : null,
      message: null,
      success:
        statusCode != null ? statusCode >= 200 && statusCode < 300 : null,
      request_id: null,
      data: {
        request_payload: row.request_payload ?? null,
        response_payload: row.response_payload ?? null,
        response_time: row.response_time ?? null,
        api_key: maskApiKey(
          typeof row.api_key === 'string' ? row.api_key : null,
        ),
        actor_organization_id: row.actor_organization_id ?? null,
        target_organization_id: row.target_organization_id ?? null,
        network_account_id: row.network_account_id ?? null,
        public_account_id: row.public_account_id ?? null,
        network_membership_id: row.network_membership_id ?? null,
        member_organization_name: row.member_organization_name ?? null,
      },
    };
  }

  private async listApiErrors(
    user: AuthContext,
    params: ListLogsParams,
  ): Promise<LogListResponseDto> {
    const severity =
      params.severity &&
      (LOG_SEVERITIES as readonly string[]).includes(params.severity)
        ? params.severity
        : null;

    const { data, error } = await this.supabase.rpc(
      'get_api_error_logs' as never,
      {
        p_organization_id: user.organizationId,
        p_status_codes:
          params.status && params.status.length > 0 ? params.status : null,
        p_severity: severity,
        p_start_date: params.startDate ?? null,
        p_end_date: params.endDate ?? null,
        p_limit: params.limit,
        p_offset: params.offset,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const totalCount = Number(rows[0]?.total_count ?? 0);
    const entries = rows.map((row) => this.mapApiErrorRow(row));

    return this.buildListResponse(
      'api_error',
      entries,
      totalCount,
      params.limit,
      params.offset,
    );
  }

  private async findApiError(
    user: AuthContext,
    id: string,
  ): Promise<LogEntryResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_api_error_log' as never,
      {
        p_error_id: id,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Log with ID ${id} not found or access denied`,
      );
    }

    return this.mapApiErrorRow(row);
  }

  private mapApiErrorRow(row: Record<string, unknown>): LogEntryResponseDto {
    const errorType =
      typeof row.error_type === 'string' ? row.error_type : 'error';
    const statusCode =
      typeof row.response_status === 'number' ? row.response_status : null;

    return {
      id: String(row.error_id),
      type: 'api_error',
      timestamp: String(row.created_at),
      severity: severityFromApiError(errorType, statusCode),
      status_code: statusCode,
      method:
        typeof row.request_method === 'string' ? row.request_method : null,
      endpoint: typeof row.endpoint === 'string' ? row.endpoint : null,
      message:
        typeof row.error_message === 'string' ? row.error_message : null,
      success: statusCode != null ? statusCode < 400 : null,
      request_id:
        typeof row.request_id === 'string' ? row.request_id : null,
      data: {
        error_type: errorType,
        stack_trace: row.stack_trace ?? null,
        context: row.context ?? null,
        api_key: maskApiKey(
          typeof row.api_key === 'string' ? row.api_key : null,
        ),
      },
    };
  }

  private async listWebhookDeliveries(
    user: AuthContext,
    params: ListLogsParams,
    environment: string,
  ): Promise<LogListResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_webhook_delivery_logs_with_attempts' as never,
      {
        p_organization_id: user.organizationId,
        p_webhook_id: params.webhookId ?? null,
        p_success_only: params.successOnly ?? false,
        p_failed_only: params.failedOnly ?? false,
        p_start_date: params.startDate ?? null,
        p_end_date: params.endDate ?? null,
        p_limit: params.limit,
        p_offset: params.offset,
        p_environment: environment,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const totalCount = Number(rows[0]?.total_count ?? 0);
    const entries = rows.map((row) => this.mapWebhookDeliveryRow(row));

    return this.buildListResponse(
      'webhook_delivery',
      entries,
      totalCount,
      params.limit,
      params.offset,
    );
  }

  private async findWebhookDelivery(
    user: AuthContext,
    id: string,
    environment: string,
  ): Promise<LogEntryResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_webhook_delivery_log_with_attempts' as never,
      {
        p_log_id: id,
        p_organization_id: user.organizationId,
        p_environment: environment,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Log with ID ${id} not found or access denied`,
      );
    }

    return this.mapWebhookDeliveryRow(row);
  }

  private mapWebhookDeliveryRow(
    row: Record<string, unknown>,
  ): LogEntryResponseDto {
    const statusCode =
      typeof row.response_status === 'number' ? row.response_status : null;
    const success = row.success === true;
    const eventType =
      typeof row.event_type === 'string' ? row.event_type : null;
    const webhookUrl =
      typeof row.webhook_url === 'string' ? row.webhook_url : null;

    return {
      id: String(row.log_id),
      type: 'webhook_delivery',
      timestamp: String(row.created_at),
      severity: success ? 'info' : 'error',
      status_code: statusCode,
      method: 'POST',
      endpoint: webhookUrl ?? eventType,
      message: eventType,
      success,
      request_id: null,
      data: {
        webhook_id: row.webhook_id ?? null,
        organization_id: row.organization_id ?? null,
        event_type: eventType,
        payload: row.payload ?? null,
        response_body: row.response_body ?? null,
        attempt_number: row.attempt_number ?? null,
        ip_address: row.ip_address ?? null,
        user_agent: row.user_agent ?? null,
        headers: row.headers ?? null,
        request_duration_ms: row.request_duration_ms ?? null,
        attempts: row.attempts ?? [],
      },
    };
  }

  private async listActivity(
    user: AuthContext,
    params: ListLogsParams,
  ): Promise<LogListResponseDto> {
    const dbSeverity =
      params.severity &&
      (LOG_SEVERITIES as readonly string[]).includes(params.severity)
        ? activitySeverityToDb(params.severity)
        : null;
    const severities = dbSeverity ? [dbSeverity] : null;

    const { data, error } = await this.supabase.rpc('fetch_logs' as never, {
      p_merchant_id: user.merchantId,
      p_event: params.event ?? null,
      p_severity: dbSeverity,
      p_severities: severities,
      p_events: null,
      p_exclude_delivery_noise: true,
      p_limit: params.limit,
      p_offset: params.offset,
      p_start_date: params.startDate ?? null,
      p_end_date: params.endDate ?? null,
    } as never);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const totalCount = Number(rows[0]?.total_count ?? 0);
    const entries = rows.map((row) => this.mapActivityRow(row));

    return this.buildListResponse(
      'activity',
      entries,
      totalCount,
      params.limit,
      params.offset,
    );
  }

  private async findActivity(
    user: AuthContext,
    id: string,
  ): Promise<LogEntryResponseDto> {
    const { data, error } = await this.supabase.rpc(
      'get_activity_log' as never,
      {
        p_log_id: id,
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Log with ID ${id} not found or access denied`,
      );
    }

    return this.mapActivityRow(row);
  }

  private mapActivityRow(row: Record<string, unknown>): LogEntryResponseDto {
    const severity =
      typeof row.severity === 'string' ? row.severity : undefined;
    const statusCode =
      typeof row.response_status === 'number' ? row.response_status : null;
    const event = typeof row.event === 'string' ? row.event : null;

    return {
      id: String(row.log_id),
      type: 'activity',
      timestamp: String(row.created_at),
      severity: severityFromActivity(severity),
      status_code: statusCode,
      method:
        typeof row.request_method === 'string' ? row.request_method : null,
      endpoint:
        typeof row.request_url === 'string' ? row.request_url : null,
      message: event,
      success: statusCode != null ? statusCode < 400 : null,
      request_id: null,
      data: {
        event,
        details: row.details ?? null,
        ip_address: row.ip_address ?? null,
        operating_system: row.operating_system ?? null,
        browser: row.browser ?? null,
        location_city: row.location_city ?? null,
        location_country: row.location_country ?? null,
      },
    };
  }
}
