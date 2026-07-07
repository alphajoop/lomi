import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { WaveWebhookService } from './wave-webhook.service';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhook-sender.service';
import { WideEventService } from '../../../utils/telemetry/wide-event.service';

describe('WaveWebhookService', () => {
  let service: WaveWebhookService;
  const rpcMock = jest.fn();
  const notifyOrganizationMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.WAVE_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'development';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaveWebhookService,
        {
          provide: SupabaseService,
          useValue: {
            rpc: rpcMock,
            getClient: () => ({ rpc: rpcMock }),
          },
        },
        {
          provide: WebhookSenderService,
          useValue: { notifyOrganization: notifyOrganizationMock },
        },
        {
          provide: WideEventService,
          useValue: { logEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(WaveWebhookService);
  });

  it('accepts webhook without secret in development', async () => {
    rpcMock.mockResolvedValueOnce({ data: true, error: null });

    const result = await service.handleWebhook(
      {},
      { type: 'test.test_event' },
      '{}',
    );

    expect(result).toEqual({ message: 'Test event received' });
  });

  it('short-circuits duplicate events', async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    const result = await service.handleWebhook(
      {},
      { type: 'checkout.session.completed', data: { id: 'wave-1' } },
      '{}',
    );

    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        message: 'duplicate_event',
      }),
    );
  });

  it('verifies Wave-Signature and processes checkout.session.completed', async () => {
    process.env.WAVE_WEBHOOK_SECRET = 'wave-secret';
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        id: 'wave-session-1',
        transaction_id: 'wave-txn-1',
        amount: 1000,
        currency: 'XOF',
        checkout_status: 'complete',
        payment_status: 'succeeded',
      },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', 'wave-secret')
      .update(`t=${timestamp}.${body}`)
      .digest('hex');

    rpcMock
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: [
          {
            transaction_id: 'tx-wave-1',
            organization_id: 'org-wave-1',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ transaction_id: 'tx-wave-1', metadata: {} }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: [{ transaction_id: 'tx-wave-1', metadata: {} }],
        error: null,
      });

    const result = await service.handleWebhook(
      { 'wave-signature': `t=${timestamp},v1=${signature}` },
      JSON.parse(body),
      body,
    );

    expect(result).toEqual({ transaction_id: 'tx-wave-1' });
    expect(rpcMock).toHaveBeenCalledWith(
      'update_transaction_status',
      expect.objectContaining({
        p_transaction_id: 'tx-wave-1',
        p_status: 'completed',
      }),
    );
    expect(notifyOrganizationMock).toHaveBeenCalledWith(
      'org-wave-1',
      'PAYMENT_SUCCEEDED',
      expect.any(Object),
    );
  });

  it('routes checkout.session.payment_failed to failed status', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: [
          {
            transaction_id: 'tx-failed',
            organization_id: 'org-failed',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: [{ transaction_id: 'tx-failed', metadata: {} }],
        error: null,
      });

    const result = await service.handleWebhook(
      {},
      {
        type: 'checkout.session.payment_failed',
        data: {
          id: 'wave-failed-1',
          last_payment_error: 'declined',
        },
      },
      '{}',
    );

    expect(result).toEqual({ transaction_id: 'tx-failed' });
    expect(rpcMock).toHaveBeenCalledWith(
      'update_transaction_status',
      expect.objectContaining({
        p_transaction_id: 'tx-failed',
        p_status: 'failed',
      }),
    );
    expect(notifyOrganizationMock).toHaveBeenCalledWith(
      'org-failed',
      'PAYMENT_FAILED',
      expect.any(Object),
    );
  });
});
