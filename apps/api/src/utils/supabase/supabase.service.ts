import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { Database } from '../types/api';

/** Node < 22 has no global WebSocket; supabase realtime-js requires `ws` in server runtimes. */
const serverSupabaseOptions = {
  auth: { persistSession: false },
  realtime: { transport: ws },
} as const;

type DatabaseFunctions = Database['public']['Functions'];

@Injectable()
export class SupabaseService implements OnModuleInit {
  /** Set in `onModuleInit` after env/config is available. */
  private client!: SupabaseClient<Database>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL;

    // Use SERVICE_ROLE_KEY for API (bypasses RLS)
    // This is secure because:
    // 1. API Key Guard validates all requests
    // 2. Service layer filters by organization_id
    // 3. Service key never exposed to clients
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SECRET_KEY') ||
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase URL or Service Role Key is missing! Check your .env file.',
      );
    }

    this.client = createClient<Database>(
      supabaseUrl,
      supabaseKey,
      serverSupabaseOptions,
    );
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /** User-scoped client for dashboard RPCs that rely on auth.uid(). */
  getUserClient(accessToken: string): SupabaseClient<Database> {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL;
    const publishableKey =
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      throw new Error('Supabase publishable key is missing for user client');
    }

    return createClient<Database>(supabaseUrl, publishableKey, {
      ...serverSupabaseOptions,
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  /**
   * Typed RPC helper method that properly infers function arguments and return types
   */
  async rpc<FnName extends keyof DatabaseFunctions>(
    fnName: FnName,
    args: DatabaseFunctions[FnName]['Args'],
  ): Promise<{
    data: DatabaseFunctions[FnName]['Returns'] | null;
    error: Error | null;
  }> {
    const { data, error } = await this.client.rpc(
      fnName as string,
      args as never,
    );
    return {
      data: data as DatabaseFunctions[FnName]['Returns'] | null,
      error,
    };
  }

  /**
   * Typed table helper that returns a properly typed query builder
   */
  from<TableName extends keyof Database['public']['Tables']>(
    table: TableName,
  ): ReturnType<SupabaseClient<Database>['from']> {
    return this.client.from(table) as ReturnType<
      SupabaseClient<Database>['from']
    >;
  }
}
