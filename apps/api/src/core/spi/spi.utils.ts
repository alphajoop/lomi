import { WebhookEvent } from '../../utils/types/api';

export type UemoaCountryCode =
  | 'BJ'
  | 'BF'
  | 'CI'
  | 'ML'
  | 'NE'
  | 'SN'
  | 'TG'
  | 'GW';

const UEMOA_COUNTRIES = new Set<string>([
  'BJ',
  'BF',
  'CI',
  'ML',
  'NE',
  'SN',
  'TG',
  'GW',
]);

export function normalizeUemoaCountryCode(
  value: string | null | undefined,
): UemoaCountryCode {
  const code = (value ?? 'SN').toUpperCase().slice(0, 2);
  if (UEMOA_COUNTRIES.has(code)) {
    return code as UemoaCountryCode;
  }
  return 'SN';
}

export function toProviderAmount(baseUnitAmount: number): number {
  return Math.round(baseUnitAmount * 100);
}

export function mapSpiWebhookEventToWebhookEvent(
  spiEventCode: string,
): WebhookEvent {
  switch (spiEventCode) {
    case 'PAIEMENT_RECU':
    case 'PAIEMENT_ENVOYE':
      return 'PAYMENT_SUCCEEDED';
    case 'PAIEMENT_REJETE':
    case 'RTP_REJETE':
      return 'PAYMENT_FAILED';
    default:
      return 'PAYMENT_FAILED';
  }
}

export function mapSpiEventToPaymentStatus(
  eventCode: string,
): 'IRREVOCABLE' | 'REJETE' | 'ENVOYE' {
  if (eventCode === 'PAIEMENT_RECU' || eventCode === 'PAIEMENT_ENVOYE') {
    return 'IRREVOCABLE';
  }
  if (eventCode === 'PAIEMENT_REJETE') {
    return 'REJETE';
  }
  return 'ENVOYE';
}
