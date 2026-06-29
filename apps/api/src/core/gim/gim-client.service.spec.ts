import { GimClientService } from './gim-client.service';
import { GimHmacService } from './gim-hmac.service';

describe('GimClientService', () => {
  const secretKeyHex =
    '34376635346431302D353564662D346334652D623965302D656239653030306637323161';

  const config = {
    merchantId: '13416315350',
    terminalId: '17406438',
    secretKeyHex,
    payByCardUrl: 'https://omni-uat.gimpay.org/Cube/PayLink.svc/api/PayByCard',
    returnUrl: 'https://api.lomi.africa/payments/gim/return',
    amountMultiplier: 100,
    disable3ds: false,
    dateTimeLocalTrxnDigitLength: 12 as const,
  };

  let service: GimClientService;

  beforeEach(() => {
    service = new GimClientService(new GimHmacService());
    jest.spyOn(service, 'getConfig').mockReturnValue(config);
  });

  it('builds PayByCard body with SecureHash', () => {
    const body = service.buildPayByCardBody({
      pan: '4221941234569109',
      expiryYyMm: '2506',
      cvv2: '123',
      amountMinorUnits: 3000,
      merchantReference: 'ref-123',
      dateTimeLocalTrxn: '250615142345',
    });

    expect(body.PAN).toBe('4221941234569109');
    expect(body.AmountTrxn).toBe(3000);
    expect(body.CurrencyCodeTrxn).toBe('952');
    expect(body.MerchantId).toBe(config.merchantId);
    expect(body.SecureHash).toMatch(/^[A-F0-9]{64}$/);
    expect(body.ReturnURL).toBe(config.returnUrl);
  });

  it('classifies 3DS redirect responses', () => {
    const result = service.classifyResponse({
      ChallengeRequired: true,
      ThreeDSUrl: 'https://acs.example/3ds',
      SystemReference: 156682,
      Success: true,
    });

    expect(result.kind).toBe('redirect_3ds');
    if (result.kind === 'redirect_3ds') {
      expect(result.threeDsUrl).toBe('https://acs.example/3ds');
    }
  });

  it('classifies immediate approval', () => {
    const result = service.classifyResponse({
      Success: true,
      ActionCode: '000',
      SystemReference: 156682,
    });

    expect(result.kind).toBe('final');
    if (result.kind === 'final') {
      expect(result.approved).toBe(true);
    }
  });

  it('parses extra response fields defensively', () => {
    const raw = service.parsePayByCardResponse({
      Success: true,
      RefNumber: '000349348366',
      TransactionNo: '000349348366',
    });
    expect(raw.RefNumber).toBe('000349348366');
    expect(raw.TransactionNo).toBe('000349348366');
  });
});
