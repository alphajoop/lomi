import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDeliveryLogsService } from './webhook-delivery-logs.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('WebhookDeliveryLogsService', () => {
  let service: WebhookDeliveryLogsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDeliveryLogsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(WebhookDeliveryLogsService);
  });

  it('calls get_webhook_delivery_logs with webhook and merchant scope', async () => {
    mock.rpc.mockResolvedValue({ data: [{ log_id: 'log-1' }], error: null });

    const result = await service.findAll(user, 'wh-1', true, false, 10, 0);

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith('get_webhook_delivery_logs', {
      p_webhook_id: 'wh-1',
      p_merchant_id: user.merchantId,
      p_limit: 10,
      p_offset: 0,
      p_success_only: true,
      p_failed_only: false,
    });
  });

  it('throws NotFoundException when delivery log is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('denies access when log organization does not match user', async () => {
    mock.rpc.mockResolvedValue({
      data: [
        {
          log_id: 'log-1',
          organization_id: '00000000-0000-0000-0000-000000000001',
        },
      ],
      error: null,
    });

    await expect(service.findOne('log-1', user)).rejects.toThrow(
      NotFoundException,
    );
  });
});
