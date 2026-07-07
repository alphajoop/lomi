import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MtnWebhookService } from './mtn-webhook.service';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhook-sender.service';
import { WideEventService } from '../../../utils/telemetry/wide-event.service';

describe('MtnWebhookService', () => {
  let service: MtnWebhookService;
  const rpcMock = jest.fn();
  const invokeMock = jest.fn();
  const notifyOrganizationMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.MTN_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'development';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MtnWebhookService,
        {
          provide: SupabaseService,
          useValue: {
            rpc: rpcMock,
            getClient: () => ({
              rpc: rpcMock,
              functions: { invoke: invokeMock },
            }),
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

    service = module.get(MtnWebhookService);
  });

  it('ignores PENDING callbacks', async () => {
    const result = await service.handleWebhook(
      { 'x-reference-id': 'ref-pending' },
      { status: 'PENDING', externalId: 'ext-pending' },
    );

    expect(result).toEqual({
      received: true,
      ignored: true,
      status: 'PENDING',
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('returns duplicate when idempotency claim is false', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          transaction_id: 'tx-mtn-1',
          organization_id: 'org-mtn-1',
          environment: 'test',
        },
      ],
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    const result = await service.handleWebhook(
      { 'x-reference-id': 'ref-1' },
      {
        status: 'SUCCESSFUL',
        externalId: 'ext-1',
        financialTransactionId: 'fin-1',
      },
    );

    expect(result).toEqual({
      received: true,
      duplicate: true,
    });
  });

  it('completes SUCCESSFUL callback in test environment without MTN re-query', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [
          {
            transaction_id: 'tx-mtn-2',
            organization_id: 'org-mtn-2',
            environment: 'test',
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: [{ transaction_id: 'tx-mtn-2', metadata: {} }],
        error: null,
      });

    const result = await service.handleWebhook(
      { 'x-reference-id': 'ref-2' },
      {
        status: 'SUCCESSFUL',
        externalId: 'ext-2',
        financialTransactionId: 'fin-2',
        amount: '1000',
        currency: 'XOF',
      },
    );

    expect(result).toEqual({
      received: true,
      transaction_id: 'tx-mtn-2',
      status: 'SUCCESSFUL',
    });
    expect(rpcMock).toHaveBeenCalledWith(
      'claim_inbound_provider_webhook_event',
      expect.objectContaining({
        p_provider: 'MTN',
        p_provider_event_id: 'ext-2:SUCCESSFUL:fin-2',
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith(
      'update_transaction_status',
      expect.objectContaining({
        p_transaction_id: 'tx-mtn-2',
        p_status: 'completed',
      }),
    );
    expect(notifyOrganizationMock).toHaveBeenCalledWith(
      'org-mtn-2',
      'PAYMENT_SUCCEEDED',
      expect.any(Object),
    );
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('throws when transaction cannot be resolved', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      service.handleWebhook(
        { 'x-reference-id': 'missing-ref' },
        { status: 'SUCCESSFUL', externalId: 'missing-ext' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
