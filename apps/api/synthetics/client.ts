import axios, { type AxiosRequestConfig } from 'axios';
import { randomUUID } from 'node:crypto';
import type { HttpMethod, HttpResponse } from './types';

export interface ApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async request(
    method: HttpMethod,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      auth?: boolean;
    },
  ): Promise<HttpResponse> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const auth = options?.auth !== false;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options?.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options?.headers ?? {}),
    };
    if (auth && this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      data: options?.body,
      timeout: this.timeoutMs,
      validateStatus: () => true,
    };

    const started = Date.now();
    const response = await axios.request(config);
    const latencyMs = Date.now() - started;

    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === 'string') {
        responseHeaders[key.toLowerCase()] = value;
      }
    }

    return {
      status: response.status,
      data: response.data,
      latencyMs,
      headers: responseHeaders,
    };
  }
}

export function newIdempotencyKey(): string {
  return randomUUID();
}
