import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SupabaseService } from '../../utils/supabase/supabase.service';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiLoggingInterceptor.name);

  constructor(private readonly supabase: SupabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.logInteraction(
            context,
            request,
            data,
            Date.now() - now,
            context.switchToHttp().getResponse().statusCode,
          );
        },
        error: (error) => {
          void this.logInteraction(
            context,
            request,
            { error: error.message },
            Date.now() - now,
            error.status || 500,
          );
        },
      }),
    );
  }

  private async logInteraction(
    context: ExecutionContext,
    request: any,
    responseBody: any,
    durationMs: number,
    statusCode: number,
  ) {
    try {
      const user = request.user;

      const apiKey =
        request.headers['x-api-key'] ||
        request.headers['x-lomi-api-key'] ||
        (request.headers.authorization &&
        request.headers.authorization.startsWith('Bearer ')
          ? request.headers.authorization.substring(7)
          : null);

      if (user && user.organizationId && apiKey) {
        // Cast to any because the types are not yet generated for the new RPC
        const rpcName = 'log_api_interaction_context' as any;

        const endpointPath = urlWithoutQuery(request.url);
        const heavyPayloadPaths = isCheckoutSessionsPath(endpointPath);
        const requestPayload = heavyPayloadPaths
          ? truncateLogPayload(request.body)
          : request.body
            ? request.body
            : {};
        const responsePayload = heavyPayloadPaths
          ? truncateLogPayload(responseBody)
          : responseBody
            ? responseBody
            : {};

        // Don't await this to avoid blocking the response
        this.supabase
          .rpc(rpcName, {
            p_actor_organization_id:
              user.actorOrganizationId || user.organizationId,
            p_target_organization_id:
              user.targetOrganizationId || user.organizationId,
            p_api_key: user.apiKey ?? apiKey,
            p_endpoint: endpointPath,
            p_request_method: request.method,
            p_request_payload: requestPayload,
            p_response_status: statusCode,
            p_response_payload: responsePayload,
            p_response_time: durationMs,
            p_network_account_id: user.networkAccountId || null,
            p_network_membership_id: user.networkMembershipId || null,
          })
          .then(({ error }) => {
            if (error) {
              this.logger.error(
                `Failed to log API interaction: ${error.message}`,
                error,
              );
            }
          })
          .catch((err) => {
            this.logger.error(
              `Exception logging API interaction: ${err.message}`,
              err,
            );
          });
      } else {
        // Debug log why logging was skipped (useful for troubleshooting)
        if (apiKey && !user) {
          this.logger.warn(
            `Skipping API log: API key present but no user/org context. ApiKeyGuard might not have run or failed silently.`,
          );
        } else if (user && !apiKey) {
          // Internal calls might have user but no API key header, which is fine to skip
        }
      }
    } catch (e) {
      this.logger.error(`Error in ApiLoggingInterceptor: ${e.message}`, e);
    }
  }
}

function urlWithoutQuery(url: string): string {
  return url.split('?')[0];
}

/** Checkout routes can carry large line_items / metadata; keep logs small. */
function isCheckoutSessionsPath(path: string): boolean {
  return (
    path === '/checkout-sessions' || path.startsWith('/checkout-sessions/')
  );
}

const CHECKOUT_LOG_PAYLOAD_MAX_CHARS = 2048;

function truncateLogPayload(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  let text: string;
  try {
    text = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return { _log_serialization_failed: true };
  }
  if (text.length <= CHECKOUT_LOG_PAYLOAD_MAX_CHARS) {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { preview: text };
    }
  }
  return {
    _truncated: true,
    original_length: text.length,
    preview: text.slice(0, CHECKOUT_LOG_PAYLOAD_MAX_CHARS),
  };
}
