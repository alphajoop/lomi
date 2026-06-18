import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { UsageEventsService } from './usage-events.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';

describe('UsageEventsService', () => {
  let service: UsageEventsService;
  let mockSupabaseClient: { rpc: jest.Mock };
  let eventEmitter: EventEmitter2;

  const mockUser = {
    merchantId: 'merchant-1',
    organizationId: 'org-1',
    environment: 'test',
  } as AuthContext;

  beforeEach(async () => {
    mockSupabaseClient = {
      rpc: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageEventsService,
        EventEmitter2,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
        {
          provide: 'BullQueue_metering',
          useValue: null,
        },
      ],
    }).compile();

    service = module.get(UsageEventsService);
    eventEmitter = module.get(EventEmitter2);
    jest.spyOn(eventEmitter, 'emit');
  });

  it('processes usage events synchronously when queue is unavailable', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ data: 'event-1', error: null })
      .mockResolvedValueOnce({
        data: {
          status: 'processed',
          meter_id: 'meter-1',
          subscription_id: 'sub-1',
          quantity_applied: 1,
        },
        error: null,
      });

    const result = await service.ingest(
      {
        transaction_id: 'txn-1',
        code: 'api_calls',
        customer_id: 'cust-1',
      },
      mockUser,
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: 'processed',
        meter_id: 'meter-1',
      }),
    );
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'enqueue_usage_event',
      expect.objectContaining({
        p_organization_id: 'org-1',
        p_transaction_id: 'txn-1',
      }),
    );
  });

  it('returns idempotent processed events from processEvent without emitting webhook', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: { status: 'processed', idempotent: true },
      error: null,
    });

    const result = await service.processEvent('event-1', 'org-1');

    expect(result).toEqual({ status: 'processed', idempotent: true });
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws when usage event is not found', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

    await expect(service.findOne('missing', mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });
});
