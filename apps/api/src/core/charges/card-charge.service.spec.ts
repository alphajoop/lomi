const stripeMockGlobal = globalThis as {
  __paymentIntentsStripeMock?: { paymentIntents: { create: jest.Mock } };
};

jest.mock('stripe', () => {
  stripeMockGlobal.__paymentIntentsStripeMock = {
    paymentIntents: {
      create: jest.fn(),
    },
  };
  return jest.fn(() => stripeMockGlobal.__paymentIntentsStripeMock);
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CardChargeService } from './card-charge.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { StripeClientsService } from '../../utils/stripe/stripe-clients.service';
import { CreateCardChargeDto } from './dto/create-card-charge.dto';
import { AuthContext } from '../common/decorators/current-user.decorator';

describe('CardChargeService', () => {
  let service: CardChargeService;
  let rpcMock: jest.Mock;

  const user = {
    merchantId: 'merch_1',
    organizationId: 'org_1',
    environment: 'test',
  } as AuthContext;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';

    rpcMock = jest.fn();
    const supabase = {
      getClient: jest.fn(() => ({
        rpc: (...args: unknown[]) => rpcMock(...args),
      })),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CardChargeService,
        StripeClientsService,
        {
          provide: SupabaseService,
          useValue: supabase,
        },
      ],
    }).compile();

    service = moduleRef.get(CardChargeService);

    rpcMock.mockImplementation((fnName: string) => {
      if (fnName === 'prepare_stripe_payment_amount') {
        return Promise.resolve({
          data: [
            {
              stripe_amount_cents: 555,
              stripe_currency: 'eur',
              original_amount_xof: 3333,
            },
          ],
          error: null,
        });
      }
      if (fnName === 'create_or_update_customer') {
        return Promise.resolve({
          data: 'cust_via_rpc',
          error: null,
        });
      }
      if (fnName === 'create_stripe_transaction') {
        return Promise.resolve({ data: 'tx_1', error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'unknown rpc' } });
    });

    stripeMockGlobal.__paymentIntentsStripeMock!.paymentIntents.create.mockReset();
    stripeMockGlobal.__paymentIntentsStripeMock!.paymentIntents.create.mockResolvedValue(
      {
        id: 'pi_test',
        client_secret: 'pi_test_secret',
        amount: 555,
        currency: 'eur',
        status: 'requires_payment_method',
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when reconciliation identifiers are incomplete', async () => {
    const dto = {
      amount: 10,
      currency_code: 'XOF',
      customer_email: 'a@example.com',
    } as CreateCardChargeDto;

    await expect(service.create(dto, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('maps conversion, creates Stripe PI, persists pending tx with merchant amount+currency', async () => {
    const dto = {
      amount: 5000,
      currency_code: 'XOF',
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Test',
      quantity: 2,
      metadata: { order: 'ORD-9' },
    } as CreateCardChargeDto;

    const result = await service.create(dto, user);

    expect((result.data as { client_secret: string }).client_secret).toBe(
      'pi_test_secret',
    );

    expect(
      stripeMockGlobal.__paymentIntentsStripeMock!.paymentIntents.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 555,
        currency: 'eur',
        metadata: expect.objectContaining({
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          original_amount: '5000',
          original_currency: 'XOF',
          original_amount_xof: '3333',
          stripe_amount_cents: '555',
          stripe_charge_currency: 'eur',
        }),
      }),
    );

    const txCall = rpcMock.mock.calls.find(
      (c: [string, ...unknown[]]) => c[0] === 'create_stripe_transaction',
    );
    expect(txCall).toBeDefined();
    expect(txCall![1]).toMatchObject({
      p_customer_id: '550e8400-e29b-41d4-a716-446655440000',
      p_amount: 5000,
      p_currency_code: 'XOF',
      p_quantity: 2,
      p_metadata: { order: 'ORD-9' },
      p_environment: 'test',
    });

    const custCalls = rpcMock.mock.calls.filter(
      (c: [string, ...unknown[]]) => c[0] === 'create_or_update_customer',
    );
    expect(custCalls).toHaveLength(0);
  });

  it('resolves customer via RPC when customer_id is absent', async () => {
    const dto = {
      amount: 100,
      currency_code: 'EUR',
      customer_email: 'a@example.com',
      customer_name: 'Ada Lovelace',
    } as CreateCardChargeDto;

    await service.create(dto, user);

    const custCall = rpcMock.mock.calls.find(
      (c: [string, ...unknown[]]) => c[0] === 'create_or_update_customer',
    );
    expect(custCall).toBeDefined();
    expect(custCall![1]).toMatchObject({
      p_email: 'a@example.com',
      p_name: 'Ada Lovelace',
    });

    const txCall = rpcMock.mock.calls.find(
      (c: [string, ...unknown[]]) => c[0] === 'create_stripe_transaction',
    );
    expect(txCall![1].p_customer_id).toBe('cust_via_rpc');
  });

  it('throws BadRequestException when amount preparation fails', async () => {
    rpcMock.mockImplementation((fnName: string) => {
      if (fnName === 'prepare_stripe_payment_amount') {
        return Promise.resolve({ data: null, error: { message: 'conv' } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const dto = {
      amount: 10,
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
    } as CreateCardChargeDto;

    await expect(service.create(dto, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(
      stripeMockGlobal.__paymentIntentsStripeMock!.paymentIntents.create,
    ).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when create_or_update_customer fails', async () => {
    rpcMock.mockImplementation((fnName: string) => {
      if (fnName === 'prepare_stripe_payment_amount') {
        return Promise.resolve({
          data: [
            {
              stripe_amount_cents: 1,
              stripe_currency: 'eur',
              original_amount_xof: 1,
            },
          ],
          error: null,
        });
      }
      if (fnName === 'create_or_update_customer') {
        return Promise.resolve({ data: null, error: { message: 'nope' } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const dto = {
      amount: 10,
      customer_email: 'x@example.com',
      customer_name: 'Test',
    } as CreateCardChargeDto;

    await expect(service.create(dto, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadRequestException when create_stripe_transaction fails', async () => {
    rpcMock.mockImplementation((fnName: string) => {
      if (fnName === 'create_stripe_payment_amount') {
        return Promise.resolve({
          data: [
            {
              stripe_amount_cents: 1,
              stripe_currency: 'eur',
              original_amount_xof: 1,
            },
          ],
          error: null,
        });
      }
      if (fnName === 'create_stripe_transaction') {
        return Promise.resolve({
          data: null,
          error: { message: 'db_conflict' },
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const dto = {
      amount: 10,
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
    } as CreateCardChargeDto;

    await expect(service.create(dto, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  describe('Stripe not configured', () => {
    it('throws ServiceUnavailableException', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const supabaseOnly = {
        getClient: jest.fn(() => ({ rpc: rpcMock })),
      };

      const mod = await Test.createTestingModule({
        providers: [
          CardChargeService,
          StripeClientsService,
          { provide: SupabaseService, useValue: supabaseOnly },
        ],
      }).compile();

      const bare = mod.get(CardChargeService);
      await expect(
        bare.create(
          {
            amount: 1,
            customer_id: '550e8400-e29b-41d4-a716-446655440000',
          } as CreateCardChargeDto,
          user,
        ),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);

      process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
    });
  });
});
