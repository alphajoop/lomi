import { BadRequestException, ConflictException } from '@nestjs/common';

const USAGE_ERROR_CODES = [
  'product_not_usage_based',
  'usage_price_not_found',
  'meter_not_found',
  'active_usage_subscription_required',
  'transaction_id_required',
  'code_required',
  'customer_id_required',
  'meter_product_must_be_usage_based',
] as const;

const LINE_ITEM_ERROR_CODES = [
  'line_items_recurring_not_supported',
  'line_items_pwyw_not_supported',
  'line_items_usage_based_not_supported',
  'line_items_mixed_product_types',
] as const;

/** Maps Postgres RPC sentinel messages to Nest HTTP exceptions. */
export function throwMappedSupabaseRpcError(message: string): never {
  if (message.includes('idempotency_key_conflict')) {
    throw new ConflictException(
      'Idempotency-Key was reused with a different request payload',
    );
  }
  if (message.includes('idempotency_fingerprint_required')) {
    throw new BadRequestException(
      'Invalid idempotency fingerprint for Idempotency-Key header',
    );
  }

  for (const code of USAGE_ERROR_CODES) {
    if (message.includes(code)) {
      throw new BadRequestException({
        message: code.replace(/_/g, ' '),
        code,
      });
    }
  }

  for (const code of LINE_ITEM_ERROR_CODES) {
    if (message.includes(code)) {
      throw new BadRequestException({
        message: `Checkout line_items rejected: ${code.replace(/^line_items_/, '').replace(/_/g, ' ')}`,
        code,
      });
    }
  }

  if (message.includes('currency_not_allowed')) {
    throw new BadRequestException(
      'Currency is not allowed for this organization',
    );
  }

  throw new Error(message);
}
