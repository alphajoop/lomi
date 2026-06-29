import type { LomiPaymentEnvironment } from '../payment-environment';

export interface CreateOrUpdateCustomerRpcInput {
  merchantId: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  address?: string | null;
  country?: string | null;
  postalCode?: string | null;
  whatsappNumber?: string | null;
  environment?: LomiPaymentEnvironment;
  customFieldsMetadata?: Record<string, unknown> | null;
}

/**
 * PostgREST matches RPC overloads from the exact set of argument names sent.
 * supabase-js drops keys whose values are `undefined`, so optional fields like
 * p_email must always be sent explicitly or the call falls through to a
 * non-existent overload ("function not found in schema cache").
 */
export function buildCreateOrUpdateCustomerRpcArgs(
  input: CreateOrUpdateCustomerRpcInput,
) {
  return {
    p_merchant_id: input.merchantId,
    p_organization_id: input.organizationId,
    p_name: input.name,
    p_email: input.email?.trim() || '',
    p_city: input.city?.trim() || '',
    p_address: input.address?.trim() || '',
    p_country: input.country?.trim() || 'CI',
    p_phone_number: input.phoneNumber?.trim() || '',
    p_postal_code: input.postalCode?.trim() || '',
    p_whatsapp_number: input.whatsappNumber?.trim() || '',
    p_custom_fields_metadata: input.customFieldsMetadata ?? null,
    p_environment: input.environment ?? 'live',
  };
}
