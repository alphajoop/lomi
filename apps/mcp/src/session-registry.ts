import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export type SessionRegistryEntry = {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
  merchantApiKey: string | null;
  provisioningApiKey: string | null;
};

/**
 * Bounded in-memory registry for streamable MCP HTTP sessions.
 */
export class McpSessionRegistry {
  private readonly sessions = new Map<string, SessionRegistryEntry>();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly maxSessions: number,
    private readonly ttlMs: number,
  ) {}

  get size(): number {
    return this.sessions.size;
  }

  /** Start periodic idle session eviction (call once at HTTP server startup). */
  startPeriodicPrune(intervalMs: number = 60_000): void {
    if (this.pruneTimer) return;
    this.pruneTimer = setInterval(() => {
      this.prune();
    }, intervalMs);
    if (typeof this.pruneTimer.unref === 'function') {
      this.pruneTimer.unref();
    }
  }

  stopPeriodicPrune(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }

  /** Remove idle sessions past TTL; closes transports. */
  prune(now: number = Date.now()): void {
    for (const [id, entry] of this.sessions) {
      if (now - entry.lastActivity > this.ttlMs) {
        void entry.transport.close();
        this.sessions.delete(id);
      }
    }
  }

  touch(sessionId: string, now: number = Date.now()): void {
    const e = this.sessions.get(sessionId);
    if (e) e.lastActivity = now;
  }

  updateMerchantApiKey(sessionId: string, apiKey: string | null): void {
    const e = this.sessions.get(sessionId);
    if (!e || !apiKey) return;
    e.merchantApiKey = apiKey;
  }

  updateProvisioningApiKey(sessionId: string, apiKey: string | null): void {
    const e = this.sessions.get(sessionId);
    if (!e || !apiKey) return;
    e.provisioningApiKey = apiKey;
  }

  getProvisioningApiKey(sessionId: string): string | null {
    return this.sessions.get(sessionId)?.provisioningApiKey ?? null;
  }

  getMerchantApiKey(sessionId: string): string | null {
    return this.sessions.get(sessionId)?.merchantApiKey ?? null;
  }

  /**
   * After prune: true if a brand-new session may be created.
   */
  canAcceptNewSession(now: number = Date.now()): boolean {
    this.prune(now);
    return this.sessions.size < this.maxSessions;
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  get(sessionId: string): SessionRegistryEntry | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Attach transport after session id is assigned (onsessioninitialized).
   */
  attachSession(
    sessionId: string,
    transport: StreamableHTTPServerTransport,
    merchantApiKey: string | null,
    provisioningApiKey: string | null = null,
  ): void {
    this.sessions.set(sessionId, {
      transport,
      lastActivity: Date.now(),
      merchantApiKey,
      provisioningApiKey,
    });
    transport.onclose = () => {
      this.sessions.delete(sessionId);
    };
  }
}
