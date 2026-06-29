import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SpiWebhookService } from './spi-webhook.service';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhook-sender.service';
import { WideEventService } from '../../../utils/telemetry/wide-event.service';

describe('SpiWebhookService', () => {
  let service: SpiWebhookService;
  const rpcMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.SPI_WEBHOOK_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiWebhookService,
        {
          provide: SupabaseService,
          useValue: { rpc: rpcMock },
        },
        {
          provide: WebhookSenderService,
          useValue: { notifyOrganization: jest.fn() },
        },
        {
          provide: WideEventService,
          useValue: { logEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SpiWebhookService);
  });

  it('completes POS SPI payment on PAIEMENT_RECU', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: {
          organization_id: 'org-1',
          transaction_id: 'tx-1',
          checkout_session_id: 'session-1',
          already_completed: false,
          status: 'completed',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ transaction_id: 'tx-1', gross_amount: 1000 }],
        error: null,
      });

    const result = await service.handleWebhook(
      {},
      { event: 'PAIEMENT_RECU', txId: 'POS-session-1' },
      JSON.stringify({ event: 'PAIEMENT_RECU', txId: 'POS-session-1' }),
    );

    expect(result.transaction_id).toBe('tx-1');
    expect(rpcMock).toHaveBeenCalledWith(
      'complete_spi_payment',
      expect.objectContaining({
        p_spi_tx_id: 'POS-session-1',
        p_spi_payment_status: 'IRREVOCABLE',
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith(
      'get_transaction',
      expect.objectContaining({
        p_transaction_id: 'tx-1',
        p_organization_id: 'org-1',
      }),
    );
  });

  it('rejects webhook when signature is invalid', async () => {
    process.env.SPI_WEBHOOK_SECRET = 'secret';

    await expect(
      service.handleWebhook(
        { 'x-spi-signature': 'bad' },
        { event: 'PAIEMENT_RECU', txId: 'POS-1' },
        '{}',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
