import { BadRequestException } from '@nestjs/common';
import { throwMappedSupabaseRpcError } from './supabase-rpc-errors';

describe('throwMappedSupabaseRpcError', () => {
  it('maps currency_not_allowed to 400', () => {
    expect(() => throwMappedSupabaseRpcError('currency_not_allowed')).toThrow(
      BadRequestException,
    );
  });
});
