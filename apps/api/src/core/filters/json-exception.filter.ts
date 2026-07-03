import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
  throttleRetryAfterSeconds,
  writeThrottleRetryAfterSeconds,
} from '../../config/http.constants';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import type { AuthContext } from '../common/decorators/current-user.decorator';

function inferWriteThrottleFromRequest(req: Request): boolean {
  if (req.method !== 'POST') return false;
  const path = req.path ?? req.url ?? '';
  return (
    path === '/checkout-sessions' ||
    path === '/payment-requests' ||
    path.endsWith('/checkout-sessions') ||
    path.endsWith('/payment-requests')
  );
}

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
  request_id: string;
};

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'bad_request';
    case HttpStatus.UNAUTHORIZED:
      return 'unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'forbidden';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.CONFLICT:
      return 'conflict';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'rate_limit_exceeded';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'service_unavailable';
    default:
      if (status >= 500) return 'internal_error';
      return 'error';
  }
}

function normalizeHttpResponse(
  status: number,
  response: string | object,
): { message: string; details: unknown; code: string } {
  if (typeof response === 'string') {
    return {
      code: mapStatusToCode(status),
      message: response,
      details: null,
    };
  }
  if (typeof response === 'object' && response !== null) {
    const r = response as Record<string, unknown>;
    if (Array.isArray(r.message)) {
      return {
        code: mapStatusToCode(status),
        message: 'Validation failed',
        details: r.message,
      };
    }
    if (typeof r.message === 'string') {
      return {
        code: mapStatusToCode(status),
        message: r.message,
        details: r.error ?? r.details ?? null,
      };
    }
  }
  return {
    code: mapStatusToCode(status),
    message: 'Request failed',
    details: response,
  };
}

type RequestWithContext = Request & {
  id?: string;
  user?: AuthContext;
  apiKey?: string;
};

function isHttpExceptionLoggingEnabled(): boolean {
  const raw = process.env.LOG_HTTP_EXCEPTIONS?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function shouldPersistHttpException(status: number): boolean {
  if (!isHttpExceptionLoggingEnabled()) return false;
  return (
    status === HttpStatus.SERVICE_UNAVAILABLE ||
    status === HttpStatus.TOO_MANY_REQUESTS
  );
}

@Catch()
export class GlobalJsonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalJsonExceptionFilter.name);

  constructor(private readonly supabase: SupabaseService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithContext>();
    const requestId = req.id ?? randomUUID();

    if (exception instanceof ThrottlerException) {
      const writeScoped = inferWriteThrottleFromRequest(req);
      const retryAfter = writeScoped
        ? writeThrottleRetryAfterSeconds()
        : throttleRetryAfterSeconds();
      const limitCap = writeScoped ? WRITE_THROTTLE_LIMIT : THROTTLE_LIMIT;
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Limit', String(limitCap));
      res.setHeader('X-RateLimit-Policy', 'fixed-window');
      res.setHeader(
        'X-RateLimit-Window-Seconds',
        String(
          writeScoped
            ? Math.max(1, Math.ceil(WRITE_THROTTLE_TTL_MS / 1000))
            : Math.max(1, Math.ceil(THROTTLE_TTL_MS / 1000)),
        ),
      );
      this.send(res, requestId, HttpStatus.TOO_MANY_REQUESTS, {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests',
          details: { retry_after_seconds: retryAfter, limit: limitCap },
        },
        request_id: requestId,
      });
      if (shouldPersistHttpException(HttpStatus.TOO_MANY_REQUESTS)) {
        this.persistHttpException(
          req,
          requestId,
          HttpStatus.TOO_MANY_REQUESTS,
          {
            code: 'rate_limit_exceeded',
            message: 'Too many requests',
            details: { retry_after_seconds: retryAfter, limit: limitCap },
          },
        );
      }
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const n = normalizeHttpResponse(status, body);
      if (shouldPersistHttpException(status)) {
        this.persistHttpException(req, requestId, status, n);
      }
      this.send(res, requestId, status, {
        error: {
          code: n.code,
          message: n.message,
          details: n.details,
        },
        request_id: requestId,
      });
      return;
    }

    const err = exception as Error;
    this.logger.error(err?.message, err?.stack);
    this.persistApiError(req, requestId, err);
    this.send(res, requestId, HttpStatus.INTERNAL_SERVER_ERROR, {
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred',
        details: null,
      },
      request_id: requestId,
    });
  }

  private persistApiError(
    req: RequestWithContext,
    requestId: string,
    err: Error,
  ): void {
    const user = req.user;
    if (!user?.organizationId) return;

    const apiKey =
      (typeof req.apiKey === 'string' && req.apiKey) ||
      user.apiKey ||
      (typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key']
        : null) ||
      (typeof req.headers['x-lomi-api-key'] === 'string'
        ? req.headers['x-lomi-api-key']
        : null);

    const endpoint = (req.path ?? req.url ?? '').split('?')[0];

    void this.supabase
      .rpc(
        'log_api_error' as never,
        {
          p_error_type: 'internal_error',
          p_error_message: err?.message ?? 'Unknown error',
          p_stack_trace: err?.stack ?? null,
          p_context: {
            request_id: requestId,
            organization_id: user.organizationId,
          },
          p_organization_id: user.organizationId,
          p_api_key: apiKey,
          p_endpoint: endpoint,
          p_request_method: req.method,
          p_request_id: requestId,
          p_response_status: 500,
        } as never,
      )
      .then(({ error }) => {
        if (error) {
          this.logger.error(
            `Failed to persist API error log: ${error.message}`,
            error,
          );
        }
      })
      .catch((persistErr: Error) => {
        this.logger.error(
          `Exception persisting API error log: ${persistErr.message}`,
          persistErr,
        );
      });
  }

  private persistHttpException(
    req: RequestWithContext,
    requestId: string,
    status: number,
    normalized: { code: string; message: string; details: unknown },
  ): void {
    const user = req.user;
    if (!user?.organizationId) return;

    const apiKey =
      (typeof req.apiKey === 'string' && req.apiKey) ||
      user.apiKey ||
      (typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key']
        : null) ||
      (typeof req.headers['x-lomi-api-key'] === 'string'
        ? req.headers['x-lomi-api-key']
        : null);

    const endpoint = (req.path ?? req.url ?? '').split('?')[0];

    void this.supabase
      .rpc(
        'log_api_error' as never,
        {
          p_error_type: normalized.code,
          p_error_message: normalized.message,
          p_stack_trace: null,
          p_context: {
            request_id: requestId,
            organization_id: user.organizationId,
            details: normalized.details,
          },
          p_organization_id: user.organizationId,
          p_api_key: apiKey,
          p_endpoint: endpoint,
          p_request_method: req.method,
          p_request_id: requestId,
          p_response_status: status,
        } as never,
      )
      .then(({ error }) => {
        if (error) {
          this.logger.error(
            `Failed to persist HTTP exception log: ${error.message}`,
            error,
          );
        }
      })
      .catch((persistErr: Error) => {
        this.logger.error(
          `Exception persisting HTTP exception log: ${persistErr.message}`,
          persistErr,
        );
      });
  }

  private send(
    res: Response,
    requestId: string,
    status: number,
    body: ErrorBody,
  ): void {
    if (!res.headersSent) {
      res.setHeader('X-Request-Id', requestId);
      res.status(status).json(body);
    }
  }
}
