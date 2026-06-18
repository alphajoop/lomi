/**
 * Removes internal / PSP-identifying fields before merchant-facing webhooks.
 * Webhook delivery logs persist the same payload object downstream.
 *
 * Mutates `txnData` in place (matches Stripe/Wave callers that already did this).
 */
export function sanitizeMerchantWebhookTransactionPayload(
  txnData: Record<string, unknown> | null | undefined,
): void {
  if (!txnData || typeof txnData !== 'object') return;

  const md = txnData.metadata;
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    const metadata = md as Record<string, unknown>;
    const sensitiveKeys = [
      'is_international_card',
      'applied_intl_fee',
      'intl_fee_percentage',
      'card_country',
      'conversion_rate',
      'original_fee_amount',
      'base_amount_xof',
      // Wave internal fields
      'emails_sent',
      'emails_sent_at',
      'balance_updated',
      'balance_updated_at',
      'channel_balance_updated',
      'credited_fee_amount_xof',
      'credited_net_amount_xof',
      'credited_gross_amount_xof',
      'wave_session',
    ];
    for (const key of sensitiveKeys) {
      delete metadata[key];
    }
    for (const key of Object.keys(metadata)) {
      if (key.startsWith('stripe_')) {
        delete metadata[key];
      }
    }
  }

  const topLevelSensitiveKeys = [
    'fee_structure_id',
    'integration_source',
    'is_bnpl',
    'is_pos',
    'spi_account_number',
    'spi_bulk_instruction_id',
    'spi_date_envoi',
    'spi_date_irrevocabilite',
    'spi_discount_amount',
    'spi_discount_rate',
    'spi_end2end_id',
    'spi_payment_category',
    'spi_payment_flow_type',
    'spi_payment_status',
    'spi_rejection_reason',
    'spi_tx_id',
    'stripe_payment_intent_id',
  ];
  for (const key of topLevelSensitiveKeys) {
    delete txnData[key];
  }
  for (const key of Object.keys(txnData)) {
    if (key.startsWith('stripe_')) {
      delete txnData[key];
    }
  }
}
