import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { WebhookQueueProcessor } from './webhook.processor';
import {
  WebhookSenderService,
  type Webhook,
} from '../webhook-sender.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';

describe('WebhookQueueProcessor', () => {
  let processor: WebhookQueueProcessor;

  const mockWebhookSender = {
    sendWebhookWithContext: jest.fn(),
    prepareWebhookPayload: jest.fn(),
  };

  const mockSupabase = {
    rpc: jest.fn(),
  };

  const webhook: Webhook = {
    id: 'wh_123',
    url: 'https://example.com/webhook',
    events: ['PAYMENT_SUCCEEDED'],
    secret: 'secret_123',
    active: true,
    organization_id: 'org_123',
  };

  const jobData = {
    webhook,
    event: 'PAYMENT_SUCCEEDED',
    data: { id: 'tx_123', organization_id: 'org_123' },
    dispatchId: 'dispatch_123',
    outboxId: 'outbox_123',
    merchantId: 'merchant_123',
  };

  function buildJob(overrides: Partial<Job> = {}): Job {
    return {
      id: 'job_1',
      attemptsMade: 0,
      opts: { attempts: 6 },
      data: jobData,
      ...overrides,
    } as Job;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookQueueProcessor,
        { provide: WebhookSenderService, useValue: mockWebhookSender },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    processor = module.get(WebhookQueueProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skips when webhook_dispatch_should_process returns false', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

    const result = await processor.process(buildJob());

    expect(result).toEqual({ success: true, skipped: true });
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'webhook_dispatch_should_process',
      { p_dispatch_id: 'dispatch_123' },
    );
    expect(mockWebhookSender.sendWebhookWithContext).not.toHaveBeenCalled();
  });

  it('calls sendWebhookWithContext on the success path', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });
    mockWebhookSender.sendWebhookWithContext.mockResolvedValue({
      success: true,
      shouldRetry: false,
    });

    const result = await processor.process(buildJob());

    expect(mockWebhookSender.sendWebhookWithContext).toHaveBeenCalledWith(
      webhook,
      'PAYMENT_SUCCEEDED',
      jobData.data,
      {
        dispatchId: 'dispatch_123',
        outboxId: 'outbox_123',
        attemptNumber: 1,
        merchantId: 'merchant_123',
      },
    );
    expect(result).toEqual({ success: true, webhookId: webhook.id });
  });

  it('dead-letters on non-retryable failure', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValue({ data: null, error: null });
    mockWebhookSender.sendWebhookWithContext.mockResolvedValue({
      success: false,
      shouldRetry: false,
      deadLetterReason: 'client_error_http',
      lastResponseStatus: 400,
      lastResponseBody: 'bad request',
    });
    mockWebhookSender.prepareWebhookPayload.mockReturnValue({
      id: 'outbox_123',
      event: 'PAYMENT_SUCCEEDED',
      data: jobData.data,
    });

    const result = await processor.process(buildJob());

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'mark_webhook_dispatch_dead_letter',
      {
        p_dispatch_id: 'dispatch_123',
        p_reason: 'client_error_http',
      },
    );
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'log_webhook_delivery',
      expect.objectContaining({
        p_webhook_id: webhook.id,
        p_response_status: 400,
      }),
    );
    expect(result).toEqual({
      success: false,
      terminal: true,
      webhookId: webhook.id,
    });
  });

  it('onFailed marks dead letter after max attempts', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    mockWebhookSender.prepareWebhookPayload.mockReturnValue({
      id: 'outbox_123',
      event: 'PAYMENT_SUCCEEDED',
      data: jobData.data,
    });

    const job = buildJob({ attemptsMade: 6, opts: { attempts: 6 } });

    await processor.onFailed(job, new Error('delivery exhausted'));

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'mark_webhook_dispatch_dead_letter',
      {
        p_dispatch_id: 'dispatch_123',
        p_reason: expect.stringContaining('exhausted_bull_attempts'),
      },
    );
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'log_webhook_delivery',
      expect.objectContaining({
        p_webhook_id: webhook.id,
        p_response_status: 0,
      }),
    );
  });
});
