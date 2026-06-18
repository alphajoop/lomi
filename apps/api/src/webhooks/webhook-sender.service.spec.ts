import { Test, TestingModule } from '@nestjs/testing';
import { WebhookSenderService, Webhook } from './webhook-sender.service';
import { SupabaseService } from '../utils/supabase/supabase.service';
import {
  deliverMerchantWebhook,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';

jest.mock('./merchant-webhook-url', () => ({
  ...jest.requireActual('./merchant-webhook-url'),
  deliverMerchantWebhook: jest.fn(),
}));

const mockedDeliverMerchantWebhook =
  deliverMerchantWebhook as jest.MockedFunction<typeof deliverMerchantWebhook>;

describe('WebhookSenderService', () => {
  let service: WebhookSenderService;

  const mockSupabaseService = {
    getClient: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSenderService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<WebhookSenderService>(WebhookSenderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWebhook', () => {
    const webhook: Webhook = {
      id: 'wh_123',
      url: 'https://example.com/webhook',
      events: ['PAYMENT_SUCCEEDED'],
      secret: 'secret_123',
      active: true,
      organization_id: 'org_123',
    };
    const event = 'PAYMENT_SUCCEEDED';
    const data = { id: 'tx_123' };

    it('should send webhook successfully', async () => {
      mockedDeliverMerchantWebhook.mockResolvedValue({
        status: 200,
        data: 'OK',
        deliveredUrl: webhook.url,
        usedAlternateHost: false,
      });
      mockSupabaseService.rpc.mockResolvedValue({ data: null, error: null });

      const result = await service.sendWebhook(webhook, event, data);

      expect(result).toBe(true);
      expect(mockedDeliverMerchantWebhook).toHaveBeenCalledWith(
        webhook.url,
        expect.any(String),
        expect.objectContaining({
          'X-Lomi-Event': event,
          'X-Lomi-Signature': expect.any(String),
        }),
      );
      expect(mockSupabaseService.rpc).toHaveBeenCalledWith(
        'log_webhook_delivery',
        expect.objectContaining({
          p_webhook_id: webhook.id,
          p_response_status: 200,
        }),
      );
    });

    it('should retry on failure', async () => {
      mockedDeliverMerchantWebhook
        .mockResolvedValueOnce({
          status: 500,
          data: 'error',
          deliveredUrl: webhook.url,
          usedAlternateHost: false,
        })
        .mockResolvedValueOnce({
          status: 200,
          data: 'OK',
          deliveredUrl: webhook.url,
          usedAlternateHost: false,
        });
      mockSupabaseService.rpc.mockResolvedValue({ data: null, error: null });

      const result = await service.sendWebhook(webhook, event, data, 1, 10);

      expect(result).toBe(true);
      expect(mockedDeliverMerchantWebhook).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockedDeliverMerchantWebhook.mockResolvedValue({
        status: 500,
        data: 'error',
        deliveredUrl: webhook.url,
        usedAlternateHost: false,
      });
      mockSupabaseService.rpc.mockResolvedValue({ data: null, error: null });

      const result = await service.sendWebhook(webhook, event, data, 1, 10);

      expect(result).toBe(false);
      expect(mockedDeliverMerchantWebhook).toHaveBeenCalledTimes(2);
      expect(mockSupabaseService.rpc).toHaveBeenCalledWith(
        'log_webhook_delivery',
        expect.objectContaining({
          p_response_status: 500,
        }),
      );
    });

    it('should not send if webhook is inactive', async () => {
      const inactiveWebhook = { ...webhook, active: false };
      const result = await service.sendWebhook(inactiveWebhook, event, data);
      expect(result).toBe(false);
      expect(mockedDeliverMerchantWebhook).not.toHaveBeenCalled();
    });

    it('should not send if event is not subscribed', async () => {
      const result = await service.sendWebhook(webhook, 'PAYMENT_FAILED', data);
      expect(result).toBe(false);
      expect(mockedDeliverMerchantWebhook).not.toHaveBeenCalled();
    });

    it('should block unsafe webhook URLs before sending', async () => {
      mockedDeliverMerchantWebhook.mockRejectedValue(
        new UnsafeWebhookUrlError('Webhook URL resolves to a private address'),
      );

      const result = await service.sendWebhook(webhook, event, data);

      expect(result).toBe(false);
      expect(mockedDeliverMerchantWebhook).toHaveBeenCalledTimes(1);
    });
  });
});
