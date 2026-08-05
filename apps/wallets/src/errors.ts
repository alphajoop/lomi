export type PayRejectReason =
  | 'invalid_virtual_wallet_key'
  | 'virtual_wallet_inactive'
  | 'amount_exceeds_max_transaction'
  | 'period_allowance_exceeded'
  | 'destination_not_allowed'
  | 'insufficient_account_balance'
  | 'invalid_amount'
  | 'invalid_destination'
  | 'idempotency_conflict';

export class WalletsError extends Error {
  constructor(
    public readonly code: PayRejectReason | string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'WalletsError';
  }
}

export function payReject(
  reason: PayRejectReason,
  message: string,
  status = 400,
): WalletsError {
  return new WalletsError(reason, message, status);
}
