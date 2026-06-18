import {
  deriveMtnChargeNextAction,
  deriveWaveChargeNextAction,
  deriveCardChargeNextAction,
} from './charge-next-action';

describe('charge next_action derivation', () => {
  it('maps Wave launch URL to redirect', () => {
    expect(
      deriveWaveChargeNextAction({
        wave_launch_url: 'https://pay.wave.com/c/abc',
      }),
    ).toEqual({ type: 'redirect', url: 'https://pay.wave.com/c/abc' });
  });

  it('maps MTN PENDING to await_webhook', () => {
    expect(deriveMtnChargeNextAction({ status: 'PENDING' })).toEqual({
      type: 'await_webhook',
      status: 'PENDING',
    });
  });

  it('maps card client_secret', () => {
    expect(
      deriveCardChargeNextAction({
        client_secret: 'pi_secret',
        status: 'requires_payment_method',
      }),
    ).toEqual({ type: 'client_secret', client_secret: 'pi_secret' });
  });
});
