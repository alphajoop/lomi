export const LOG_TYPES = [
  'api_request',
  'api_error',
  'webhook_delivery',
  'activity',
] as const;

export type LogType = (typeof LOG_TYPES)[number];

export const LOG_SEVERITIES = [
  'info',
  'warning',
  'error',
  'critical',
] as const;

export type LogSeverity = (typeof LOG_SEVERITIES)[number];

export function isLogType(value: string): value is LogType {
  return (LOG_TYPES as readonly string[]).includes(value);
}
