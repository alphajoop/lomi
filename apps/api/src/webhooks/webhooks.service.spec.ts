import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { WebhookSenderService } from './webhook-sender.service';
import { AuthContext } from '../core/common/decorators/current-user.decorator';
import {
  resolveSafeMerchantWebhookTarget,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';

jest.mock('./merchant-webhook-url', () => ({
  ...jest.requireActual('./merchant-webhook-url'),
  resolveSafeMerchantWebhookTarget: jest.fn(),
}));

const mockedResolveSafeTarget =
  resolveSafeMerchantWebhookTarget as jest.MockedFunction<
    typeof resolveSafeMerchantWebhookTarget
  >;

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockRpc = jest.fn();
  const mockSupabaseService = {
    getClient: jest.fn(() => ({ rpc: mockRpc })),
    rpc: mockRpc,
  };
  const mockWebhookSender = {
    sendStoredWebhookPayload: jest.fn(),
  };

  const user: AuthContext = {
    merchantId: 'merch-1',
    organizationId: 'org-1',
    environment: 'live',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: WebhookSenderService, useValue: mockWebhookSender },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(WebhooksService);
    jest.clearAllMocks();
  });

  it('creates webhook via RPC and returns secret once', async () => {
    mockedResolveSafeTarget.mockResolvedValue({
      url: 'https://example.com/hook',
      hostname: 'example.com',
      port: 443,
      pinnedAddresses: ['93.184.216.34'],
    });
    mockRpc
      .mockResolvedValueOnce({ data: 'wh-uuid', error: null })
      .mockResolvedValueOnce({
        data: [
          {
            webhook_id: 'wh-uuid',
            url: 'https://example.com/hook',
            authorized_events: ['PAYMENT_SUCCEEDED'],
            is_active: true,
            verification_token: 'whsec_test',
          },
        ],
        error: null,
      });

    const result = await service.create(
      {
        url: 'https://example.com/hook',
        authorized_events: ['PAYMENT_SUCCEEDED'],
      },
      user,
    );

    expect(mockRpc).toHaveBeenCalledWith(
      'create_webhook',
      expect.objectContaining({
        p_organization_id: 'org-1',
        p_environment: 'live',
      }),
    );
    expect(result.secret).toBe('whsec_test');
    expect(result.data).not.toHaveProperty('verification_token');
  });

  it('rejects unsafe webhook URLs on create', async () => {
    mockedResolveSafeTarget.mockRejectedValue(
      new UnsafeWebhookUrlError(
        'Webhook URL must not target private addresses',
      ),
    );

    await expect(
      service.create(
        {
          url: 'https://127.0.0.1/hook',
          authorized_events: ['PAYMENT_SUCCEEDED'],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('lists webhooks without verification_token', async () => {
    mockRpc.mockResolvedValue({
      data: [{ webhook_id: 'wh-1', verification_token: 'whsec_x' }],
      error: null,
    });

    const rows = await service.findAll(user);
    expect(rows[0]).not.toHaveProperty('verification_token');
  });
});
