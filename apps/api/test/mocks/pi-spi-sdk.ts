export class PiSpiSDK {
  constructor(_config: Record<string, string>) {}
}

export enum AliasType {
  SHID = 'SHID',
  MCOD = 'MCOD',
  MBNO = 'MBNO',
}

export const xofToCentimes = (amount: number) => Math.round(amount * 100);
