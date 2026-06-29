import { signGimRequest, verifyGimReturn } from './gim-hmac.service';

describe('gim-hmac.service', () => {
  describe('signGimRequest (Appendix A)', () => {
    it('matches the guide worked example', () => {
      const secretKeyHex =
        '34376635346431302D353564662D346334652D623965302D656239653030306637323161';
      const hash = signGimRequest(
        {
          DateTimeLocalTrxn: '1811101423',
          MerchantId: '45374',
          TerminalId: '84949616',
        },
        secretKeyHex,
      );
      expect(hash).toBe(
        'CF0B9237DCC8D31F985B6203BDBA634019717D746BAA1B8C7F198BA3DA0B6A96',
      );
    });
  });

  describe('verifyGimReturn (Appendix C)', () => {
    it('matches the guide worked example', () => {
      const secretKeyHex =
        '66623430313531632D663137362D346664332D616634392D396531633665336337376230';
      const query = {
        ActionCode: '00',
        AuthCode: '013832',
        MerchantReference: 'REF_TXN_123',
        Message: 'Approved',
        NetworkReference: '1100051762',
        ReceiptNumber: '824201644448',
        Success: 'true',
        SystemReference: '48879',
      };
      const received =
        'A3B7B9BB5796CC734F81DABD12907498DEAC4D805D9D8277A9ECA3164A23CA7B';

      expect(verifyGimReturn(query, received, secretKeyHex)).toBe(true);
    });

    it('rejects tampered hashes', () => {
      const secretKeyHex =
        '66623430313531632D663137362D346664332D616634392D396531633665336337376230';
      const query = {
        ActionCode: '00',
        Success: 'true',
        SystemReference: '48879',
      };
      expect(verifyGimReturn(query, 'DEADBEEF', secretKeyHex)).toBe(false);
    });
  });
});
