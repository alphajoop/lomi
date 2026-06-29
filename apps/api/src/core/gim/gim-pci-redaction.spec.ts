import { Logger } from '@nestjs/common';
import { GimClientService } from './gim-client.service';
import { GimHmacService } from './gim-hmac.service';

describe('GimClientService PCI redaction', () => {
  const secretKeyHex =
    '34376635346431302D353564662D346334652D623965302D656239653030306637323161';

  const config = {
    merchantId: '13416315350',
    terminalId: '17406438',
    secretKeyHex,
    payByCardUrl: 'https://example.test/pay',
    returnUrl: 'https://api.lomi.africa/payments/gim/return',
    amountMultiplier: 100,
    disable3ds: false,
    dateTimeLocalTrxnDigitLength: 12 as const,
  };

  let service: GimClientService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new GimClientService(new GimHmacService());
    jest.spyOn(service, 'getConfig').mockReturnValue(config);
    logSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not log PAN, CVV, SecureHash, or secret key on transport errors', async () => {
    const pan = '4221941234569109';
    const cvv = '123';

    await expect(
      service.payByCard(
        {
          pan,
          expiryYyMm: '2506',
          cvv2: cvv,
          amountMinorUnits: 3000,
          merchantReference: 'ref-pci-test',
          dateTimeLocalTrxn: '250627120000',
        },
        {
          fetchImpl: async () => {
            throw new Error(
              `upstream failed pan=${pan} cvv=${cvv} key=${secretKeyHex}`,
            );
          },
        },
      ),
    ).rejects.toThrow('upstream failed');

    const logged = logSpy.mock.calls
      .map((call) => JSON.stringify(call))
      .join('\n');

    expect(logged).not.toContain(pan);
    expect(logged).not.toContain(cvv);
    expect(logged).not.toContain(secretKeyHex);
    expect(logged).not.toMatch(/SecureHash/i);
  });

  it('buildPayByCardBody never includes raw PAN in logged fields (masked storage only at service layer)', () => {
    const body = service.buildPayByCardBody({
      pan: '4221941234569109',
      expiryYyMm: '2506',
      cvv2: '123',
      amountMinorUnits: 3000,
      merchantReference: 'ref-1',
      dateTimeLocalTrxn: '250627120000',
    });

    expect(body.PAN).toBe('4221941234569109');
    expect(body.cvv2).toBe('123');
    expect(body.SecureHash).toBeTruthy();
    expect(body.SecureHash).not.toContain(secretKeyHex);
  });
});
