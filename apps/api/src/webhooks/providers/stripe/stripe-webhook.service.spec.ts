import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeWebhookService } from './stripe-webhook.service';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhook-sender.service';
import { WideEventService } from '../../../utils/telemetry/wide-event.service';
import { StripeClientsService } from '../../../utils/stripe/stripe-clients.service';
import { constructStripeWebhookEvent } from '../../../utils/stripe/stripe-keys';

jest.mock('../../../utils/stripe/stripe-keys', () => ({
  constructStripeWebhookEvent: jest.fn(),
}));

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  const rpcMock = jest.fn();
  const getClientRpcMock = jest.fn();
  const notifyOrganizationMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET_TEST;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: SupabaseService,
          useValue: {
            rpc: rpcMock,
            getClient: () => ({ rpc: getClientRpcMock }),
          },
        },
        {
          provide: WebhookSenderService,
          useValue: { notifyOrganization: notifyOrganizationMock },
        },
        {
          provide: StripeClientsService,
          useValue: { getClientForStripeLivemode: jest.fn().mockReturnValue(null) },
        },
        {
          provide: WideEventService,
          useValue: { logEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(StripeWebhookService);
  });

  it('returns duplicate when idempotency claim is false', async () => {
    const event = {
      id: 'evt_dup',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1', metadata: {} } },
    } as Stripe.Event;

    (constructStripeWebhookEvent as jest.Mock).mockReturnValue(event);
    rpcMock.mockResolvedValueOnce({ data: false, error: null });

    const result = await service.handleWebhook('sig', '{}');

    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        event_id: 'evt_dup',
      }),
    );
    expect(getClientRpcMock).not.toHaveBeenCalled();
  });

  it('processes payment_intent.succeeded and triggers merchant webhook', async () => {
    const paymentIntent = {
      id: 'pi_success',
      livemode: false,
      amount: 1000,
      currency: 'xof',
      metadata: {
        organization_id: 'org-1',
        checkout_session_id: 'cs-1',
      },
      latest_charge: 'ch_1',
      payment_method: null,
    } as unknown as Stripe.PaymentIntent;

    const event = {
      id: 'evt_success',
      type: 'payment_intent.succeeded',
      data: { object: paymentIntent },
    } as Stripe.Event;

    (constructStripeWebhookEvent as jest.Mock).mockReturnValue(event);
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    getClientRpcMock.mockResolvedValueOnce({
      data: {
        transaction_id: 'tx-1',
        organization_id: 'org-1',
        environment: 'live',
      },
      error: null,
    });

    const result = await service.handleWebhook('sig', '{}');

    expect(result).toEqual(
      expect.objectContaining({
        eventType: 'payment_intent.succeeded',
        payment_intent_id: 'pi_success',
      }),
    );
    expect(getClientRpcMock).toHaveBeenCalledWith(
      'update_stripe_checkout_status',
      expect.objectContaining({
        p_stripe_payment_intent_id: 'pi_success',
        p_payment_status: 'succeeded',
      }),
    );
    expect(notifyOrganizationMock).toHaveBeenCalledWith(
      'org-1',
      'PAYMENT_SUCCEEDED',
      expect.objectContaining({ transaction_id: 'tx-1' }),
    );
  });

  it('rejects invalid signature in production mode', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    (constructStripeWebhookEvent as jest.Mock).mockImplementation(() => {
      throw new Error('bad signature');
    });

    await expect(service.handleWebhook('sig', '{}')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    process.env.NODE_ENV = previousNodeEnv;
  });
});
