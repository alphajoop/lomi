import { BadRequestException } from '@nestjs/common';
import type { SupabaseService } from '../../utils/supabase/supabase.service';
import type { CurrencyCode } from '../types/api';

export type OrganizationPaymentParameters = {
  default_currency: CurrencyCode;
  allowed_currencies: CurrencyCode[];
  default_card_currency: CurrencyCode;
  require_email: boolean;
  require_phone: boolean;
  require_name: boolean;
  require_billing_address: boolean;
  default_success_url: string;
  default_cancel_url: string;
  display_coupon_field: boolean;
  appearance_theme: string;
  appearance_border_radius: string;
  appearance_billing_address: string;
};

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['XOF', 'USD', 'EUR'];

export async function fetchOrganizationPaymentParameters(
  supabase: SupabaseService,
  organizationId: string,
): Promise<OrganizationPaymentParameters> {
  const { data, error } = await supabase.getClient().rpc(
    'fetch_organization_payment_parameters' as never,
    { p_organization_id: organizationId } as never,
  );

  if (error || !data || typeof data !== 'object') {
    throw new BadRequestException(
      'Failed to load organization payment parameters',
    );
  }

  const raw = data as Record<string, unknown>;
  const allowed = Array.isArray(raw.allowed_currencies)
    ? (raw.allowed_currencies as CurrencyCode[])
    : SUPPORTED_CURRENCIES;

  return {
    default_currency: (raw.default_currency as CurrencyCode) ?? 'XOF',
    allowed_currencies: allowed,
    default_card_currency:
      (raw.default_card_currency as CurrencyCode) ??
      (raw.default_currency as CurrencyCode) ??
      'XOF',
    require_email: raw.require_email !== false,
    require_phone: raw.require_phone !== false,
    require_name: raw.require_name !== false,
    require_billing_address: raw.require_billing_address === true,
    default_success_url: String(raw.default_success_url ?? ''),
    default_cancel_url: String(raw.default_cancel_url ?? ''),
    display_coupon_field: raw.display_coupon_field !== false,
    appearance_theme: String(raw.appearance_theme ?? 'stripe'),
    appearance_border_radius: String(raw.appearance_border_radius ?? '4px'),
    appearance_billing_address: String(
      raw.appearance_billing_address ?? 'auto',
    ),
  };
}

export function resolveRequestedCurrency(
  requested: string | undefined | null,
  params: OrganizationPaymentParameters,
): CurrencyCode {
  const resolved = (requested?.toUpperCase() ??
    params.default_currency) as CurrencyCode;

  if (!SUPPORTED_CURRENCIES.includes(resolved)) {
    throw new BadRequestException(
      `Unsupported currency '${resolved}'. Use XOF, USD, or EUR.`,
    );
  }

  if (!params.allowed_currencies.includes(resolved)) {
    throw new BadRequestException(
      `Currency '${resolved}' is not allowed for this organization.`,
    );
  }

  return resolved;
}

export function resolveCardCurrency(
  currencyCode: string | undefined | null,
  currencyAlias: string | undefined | null,
  params: OrganizationPaymentParameters,
): CurrencyCode {
  const requested = currencyCode ?? currencyAlias;
  if (requested) {
    return resolveRequestedCurrency(requested, params);
  }
  return resolveRequestedCurrency(params.default_card_currency, params);
}
