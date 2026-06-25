import { AsyncLocalStorage } from 'node:async_hooks';

export type McpRequestStore = {
  requestId: string;
  sessionId?: string;
};

export const mcpRequestAls = new AsyncLocalStorage<McpRequestStore>();

export function getMcpRequestStore(): McpRequestStore | undefined {
  return mcpRequestAls.getStore();
}

/** Structured JSON log line (secrets must never be passed in fields). */
export function mcpLog(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const store = getMcpRequestStore();
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: 'lomi-mcp',
      event,
      requestId: store?.requestId,
      sessionId: store?.sessionId,
      ...fields,
    }),
  );
}
