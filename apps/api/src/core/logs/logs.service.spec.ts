import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('LogsService', () => {
  let service: LogsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(LogsService);
  });

  it('lists api_request logs via get_api_request_logs RPC', async () => {
    mock.rpc.mockResolvedValue({
      data: [
        {
          interaction_id: 'log-1',
          created_at: '2026-07-06T00:00:00.000Z',
          response_status: 200,
          request_method: 'GET',
          endpoint: '/v1/charges',
          total_count: 1,
        },
      ],
      error: null,
    });

    const result = await service.list(user, {
      type: 'api_request',
      limit: 25,
      offset: 0,
    });

    expect(result.type).toBe('api_request');
    expect(result.data).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'get_api_request_logs',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_environment: 'live',
      }),
    );
  });

  it('throws NotFoundException when api_request log is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(
      service.findOne(user, 'api_request', 'missing'),
    ).rejects.toThrow(NotFoundException);
  });

  it('propagates RPC errors from list', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'logs failed' },
    });

    await expect(
      service.list(user, {
        type: 'api_error',
        limit: 25,
        offset: 0,
      }),
    ).rejects.toThrow('logs failed');
  });
});
