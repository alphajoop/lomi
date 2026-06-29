export class PiSpiAuthError extends Error {
  statusCode = 401;
}

export class PiSpiSDK {
  constructor(_config: Record<string, unknown>) {}
  demandesPaiement = { create: jest.fn() };
  qr = { payload: jest.fn() };
  alias = { create: jest.fn() };
  webhooks = { create: jest.fn() };
}

export enum AliasType {
  SHID = 'SHID',
  MCOD = 'MCOD',
  MBNO = 'MBNO',
}

export const xofToCentimes = (amount: number) => Math.round(amount * 100);

export const WEBHOOK_EVENTS = {
  PAIEMENT_RECU: 'PAIEMENT_RECU',
  PAIEMENT_ENVOYE: 'PAIEMENT_ENVOYE',
  PAIEMENT_REJETE: 'PAIEMENT_REJETE',
};
