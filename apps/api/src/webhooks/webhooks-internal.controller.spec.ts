import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksInternalController } from './webhooks-internal.controller';
import { WebhookSenderService } from './webhook-sender.service';
import { InternalCronGuard } from '../core/common/guards/internal-cron.guard';

describe('WebhooksInternalController', () => {
  let controller: WebhooksInternalController;

  const mockWebhookSender = {
    queuePendingOutboxDispatches: jest.fn(),
  };

  const mockWebhookQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksInternalController],
      providers: [
        {
          provide: WebhookSenderService,
          useValue: mockWebhookSender,
        },
        {
          provide: 'BullQueue_webhooks',
          useValue: mockWebhookQueue,
        },
      ],
    })
      .overrideGuard(InternalCronGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(WebhooksInternalController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST process-outbox calls queuePendingOutboxDispatches with outbox_id', async () => {
    mockWebhookSender.queuePendingOutboxDispatches.mockResolvedValue({
      queued: 1,
      outbox_id: 'outbox_123',
      event: 'PAYMENT_SUCCEEDED',
    });

    const result = await controller.processOutbox({ outbox_id: 'outbox_123' });

    expect(mockWebhookSender.queuePendingOutboxDispatches).toHaveBeenCalledWith(
      'outbox_123',
      mockWebhookQueue,
    );
    expect(result).toEqual({
      queued: 1,
      outbox_id: 'outbox_123',
      event: 'PAYMENT_SUCCEEDED',
    });
  });

  it('returns an error when outbox_id is missing', async () => {
    const result = await controller.processOutbox({});

    expect(result).toEqual({ queued: 0, error: 'outbox_id required' });
    expect(mockWebhookSender.queuePendingOutboxDispatches).not.toHaveBeenCalled();
  });
});
