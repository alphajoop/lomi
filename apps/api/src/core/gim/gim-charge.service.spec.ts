import { Test, TestingModule } from '@nestjs/testing';
import { GimChargeService } from './gim-charge.service';
import { GimClientService } from './gim-client.service';
import { GimHmacService } from './gim-hmac.service';
import { RadarService } from '../radar/radar.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhooks/webhook-sender.service';

describe('GimChargeService', () => {
  let service: GimChargeService;
  const gimClient = {
    getConfig: jest.fn().mockReturnValue({
      merchantId: '13416315350',
      terminalId: '17406438',
      secretKeyHex:
        '34376635346431302D353564662D346334652D623965302D656239653030306637323161',
      payByCardUrl: 'https://example/pay',
      returnUrl: 'https://api.lomi.africa/payments/gim/return',
      amountMultiplier: 100,
      disable3ds: false,
      dateTimeLocalTrxnDigitLength: 12,
    }),
    payByCard: jest.fn(),
  };

  const supabase = {
    getClient: jest.fn().mockReturnValue({
      rpc: jest.fn().mockResolvedValue({ data: 'tx-1', error: null }),
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }),
    rpc: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GimChargeService,
        { provide: GimClientService, useValue: gimClient },
        { provide: GimHmacService, useValue: new GimHmacService() },
        {
          provide: RadarService,
          useValue: { assertChargeAllowed: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: SupabaseService, useValue: supabase },
        {
          provide: WebhookSenderService,
          useValue: { notifyOrganization: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(GimChargeService);
    jest.clearAllMocks();
  });

  it('returns redirect_3ds next_action when challenge required', async () => {
    gimClient.payByCard.mockResolvedValue({
      kind: 'redirect_3ds',
      threeDsUrl: 'https://acs.example/3ds',
      systemReference: 99,
      raw: {},
    });

    const result = await service.executePayByCard({
      pan: '4221941234569109',
      expiryYyMm: '2506',
      cvv: '123',
      amountMinor: 3000,
      merchantReference: 'ref-1',
      transactionId: 'tx-1',
    });

    expect(result.data.status).toBe('redirect_3ds');
    expect(result.next_action).toEqual({
      type: 'redirect',
      url: 'https://acs.example/3ds',
    });
  });
});
