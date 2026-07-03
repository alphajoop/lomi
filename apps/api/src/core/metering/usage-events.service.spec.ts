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
  let mockMeteringQueue: {
    add: jest.Mock;
  } | null;

  const mockUser = {
    merchantId: 'merchant-1',
    organizationId: 'org-1',
    environment: 'test',
  } as AuthContext;

  async function createModule(queue: typeof mockMeteringQueue) {
    mockMeteringQueue = queue;
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
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(UsageEventsService);
    eventEmitter = module.get(EventEmitter2);
    jest.spyOn(eventEmitter, 'emit');
  }

  beforeEach(async () => {
    await createModule(null);
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

  it('queues usage processing with an event-scoped BullMQ job id', async () => {
    await createModule({
      add: jest.fn().mockResolvedValue({
        getState: jest.fn().mockResolvedValue('waiting'),
      }),
    });

    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: 'event-1',
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

    expect(result).toEqual({ event_id: 'event-1', status: 'pending' });
    expect(mockMeteringQueue?.add).toHaveBeenCalledWith(
      'process-usage-event',
      expect.objectContaining({ eventId: 'event-1' }),
      expect.objectContaining({ jobId: 'usage_event_event-1' }),
    );
  });

  it('processes synchronously when the queue job is already terminal but the event is still pending', async () => {
    await createModule({
      add: jest.fn().mockResolvedValue({
        getState: jest.fn().mockResolvedValue('completed'),
      }),
    });

    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ data: 'event-1', error: null })
      .mockResolvedValueOnce({
        data: { processing_status: 'pending' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          status: 'processed',
          meter_id: 'meter-1',
          quantity_applied: 4,
        },
        error: null,
      });

    const result = await service.ingest(
      {
        transaction_id: 'txn-1',
        code: 'api_calls',
        customer_id: 'cust-1',
        quantity: 4,
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
      'process_usage_event',
      { p_event_id: 'event-1' },
    );
  });

  it('reconciles stale pending usage events', async () => {
    await createModule({
      add: jest.fn().mockResolvedValue({
        getState: jest.fn().mockResolvedValue('waiting'),
      }),
    });

    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: [
        {
          event_id: 'event-1',
          organization_id: 'org-1',
          customer_id: 'cust-1',
          code: 'api_calls',
        },
      ],
      error: null,
    });

    const result = await service.reconcileStalePendingEvents({
      staleAfterSeconds: 30,
      limit: 10,
    });

    expect(result).toEqual({
      scanned: 1,
      requeued: 1,
      processed: 0,
      failed: 0,
    });
    expect(mockMeteringQueue?.add).toHaveBeenCalledTimes(1);
  });
});
