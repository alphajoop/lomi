import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiPayoutExecutionService } from '../spi/spi-payout-execution.service';

describe('PayoutsService', () => {
  let service: PayoutsService;

  const liveUser = {
    merchantId: 'merchant-1',
    organizationId: 'org-1',
    environment: 'live' as const,
  };

  const testUser = {
    ...liveUser,
    environment: 'test' as const,
  };

  const supabaseRpc = jest.fn();
  const supabaseGetClientRpc = jest.fn();
  const functionsInvoke = jest.fn();

  const supabaseMock = {
    rpc: supabaseRpc,
    getClient: jest.fn(() => ({
      rpc: supabaseGetClientRpc,
      functions: {
        invoke: functionsInvoke,
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        {
          provide: SupabaseService,
          useValue: supabaseMock,
        },
        {
          provide: SpiPayoutExecutionService,
          useValue: {
            executeAfterInitiation: jest.fn().mockResolvedValue({
              payoutId: 'payout-1',
              spiTxId: 'SPI-payout-1',
              spiStatus: 'ENVOYE',
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PayoutsService);
    jest.clearAllMocks();
  });

  it('rejects beneficiary bank payouts', async () => {
    await expect(
      service.create(
        {
          destination: 'beneficiary',
          rail: 'bank',
          amount: 1000,
          currency_code: 'XOF',
        },
        liveUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects MTN payouts in test mode', async () => {
    supabaseGetClientRpc.mockResolvedValueOnce({
      data: [
        {
          payout_method_id: '550e8400-e29b-41d4-a716-446655440000',
          organization_id: 'org-1',
          account_number: '+2250712345678',
          account_name: 'Merchant',
          payout_method_type: 'mobile_money',
          is_valid: true,
          is_spi_enabled: false,
          auto_withdrawal_mobile_provider: 'MTN',
        },
      ],
      error: null,
    });

    await expect(
      service.create(
        {
          destination: 'self',
          rail: 'mtn',
          amount: 1000,
          currency_code: 'XOF',
          payout_method_id: '550e8400-e29b-41d4-a716-446655440000',
        },
        testUser,
      ),
    ).rejects.toThrow(/MTN payouts are not available in test mode/);

    expect(functionsInvoke).not.toHaveBeenCalled();
  });

  it('calls MTN edge for live beneficiary MTN payouts', async () => {
    functionsInvoke.mockResolvedValueOnce({
      data: {
        payoutId: 'payout-mtn-uuid',
        status: 'completed',
      },
      error: null,
    });

    const result = await service.create(
      {
        destination: 'beneficiary',
        rail: 'mtn',
        amount: 1000,
        currency_code: 'XOF',
        recipient: { name: 'Ada Lovelace', phone: '+2250712345678' },
      },
      liveUser,
    );

    expect(functionsInvoke).toHaveBeenCalledWith('mtn', {
      body: {
        path: '/beneficiary-payout',
        method: 'POST',
        body: expect.objectContaining({
          merchantId: 'merchant-1',
          organizationId: 'org-1',
          recipientPhone: '+2250712345678',
        }),
      },
    });
    expect(result.data).toMatchObject({
      success: true,
      kind: 'beneficiary',
      payout_id: 'payout-mtn-uuid',
    });
  });

  it('requires payout_method_id for self payouts', async () => {
    await expect(
      service.create(
        {
          destination: 'self',
          rail: 'bank',
          amount: 1000,
          currency_code: 'XOF',
        },
        liveUser,
      ),
    ).rejects.toThrow(/payout_method_id is required/);
  });

  it('rejects beneficiary Wave payouts in test mode', async () => {
    await expect(
      service.create(
        {
          destination: 'beneficiary',
          rail: 'wave',
          amount: 1000,
          currency_code: 'XOF',
          recipient: { name: 'Ada', phone: '+221771234567' },
        },
        testUser,
      ),
    ).rejects.toThrow(/Wave payouts are not available in test mode/);

    expect(functionsInvoke).not.toHaveBeenCalled();
  });

  it('rejects self Wave payouts in test mode', async () => {
    supabaseGetClientRpc.mockResolvedValueOnce({
      data: [
        {
          payout_method_id: '550e8400-e29b-41d4-a716-446655440000',
          organization_id: 'org-1',
          account_number: '+221771234567',
          account_name: 'Merchant',
          payout_method_type: 'mobile_money',
          is_valid: true,
          is_spi_enabled: false,
          auto_withdrawal_mobile_provider: 'WAVE',
        },
      ],
      error: null,
    });

    await expect(
      service.create(
        {
          destination: 'self',
          rail: 'wave',
          amount: 1000,
          currency_code: 'XOF',
          payout_method_id: '550e8400-e29b-41d4-a716-446655440000',
        },
        testUser,
      ),
    ).rejects.toThrow(/Wave payouts are not available in test mode/);

    expect(functionsInvoke).not.toHaveBeenCalled();
  });

  it('requires recipient for beneficiary Wave payouts', async () => {
    await expect(
      service.create(
        {
          destination: 'beneficiary',
          rail: 'wave',
          amount: 1000,
          currency_code: 'XOF',
        },
        liveUser,
      ),
    ).rejects.toThrow(/recipient.name and recipient.phone are required/);
  });

  it('calls Wave edge for live beneficiary Wave payouts', async () => {
    functionsInvoke.mockResolvedValueOnce({
      data: {
        payoutId: 'payout-uuid',
        status: 'processing',
      },
      error: null,
    });

    const result = await service.create(
      {
        destination: 'beneficiary',
        rail: 'wave',
        amount: 1000,
        currency_code: 'XOF',
        recipient: { name: 'Ada Lovelace', phone: '+221771234567' },
        reason: 'Invoice #12',
      },
      liveUser,
    );

    expect(functionsInvoke).toHaveBeenCalledTimes(1);
    expect(functionsInvoke).toHaveBeenCalledWith('wave', {
      body: {
        path: '/beneficiary-payout',
        method: 'POST',
        body: {
          merchantId: 'merchant-1',
          organizationId: 'org-1',
          amount: 1000,
          currency: 'XOF',
          recipientName: 'Ada Lovelace',
          recipientPhone: '+221771234567',
          description: 'Invoice #12',
          metadata: {},
        },
      },
    });
    expect(result.data).toMatchObject({
      success: true,
      kind: 'beneficiary',
      payout_id: 'payout-uuid',
    });
  });

  it('does not fetch beneficiary payouts in test mode list', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: [{ payout_id: 'w-1' }],
      error: null,
    });

    const result = await service.findAll(testUser);

    expect(supabaseRpc).toHaveBeenCalledTimes(1);
    expect(supabaseRpc).toHaveBeenCalledWith(
      'fetch_payouts',
      expect.objectContaining({
        p_environment: 'test',
      }),
    );
    expect(result.data).toEqual([
      expect.objectContaining({ payout_id: 'w-1', kind: 'withdrawal' }),
    ]);
  });

  it('fetches beneficiary payouts in live mode list', async () => {
    supabaseRpc
      .mockResolvedValueOnce({
        data: [{ payout_id: 'w-1' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ payout_id: 'b-1' }],
        error: null,
      });

    const result = await service.findAll(liveUser);

    expect(supabaseRpc).toHaveBeenCalledTimes(2);
    expect(supabaseRpc).toHaveBeenNthCalledWith(
      2,
      'fetch_beneficiary_payouts',
      expect.any(Object),
    );
    expect(result.data).toHaveLength(2);
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'withdrawal' }),
        expect.objectContaining({ kind: 'beneficiary' }),
      ]),
    );
  });
});
