export type CheckoutFieldVisibility = 'hidden' | 'optional' | 'required';

export type CheckoutFieldScope = 'system' | 'custom';

export type SystemCheckoutFieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'billing_address';

export type CheckoutFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'checkbox'
  | 'terms'
  | 'select'
  | 'number'
  | 'address_group';

export interface CustomFieldDefinition {
  id: string;
  type: 'text' | 'email' | 'url' | 'checkbox' | 'terms';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface UnifiedCheckoutFieldDefinition {
  key: string;
  scope: CheckoutFieldScope;
  type: CheckoutFieldType;
  visibility: CheckoutFieldVisibility;
  label?: string;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

export interface ResolvedCheckoutForm {
  fields: UnifiedCheckoutFieldDefinition[];
  requireBillingAddress: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  requireName: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showName: boolean;
  customFields: CustomFieldDefinition[];
}

export interface CheckoutFormFieldFlags {
  require_billing_address?: boolean | null;
  require_email?: boolean | null;
  require_phone?: boolean | null;
  require_name?: boolean | null;
}

export interface CheckoutFormSource extends CheckoutFormFieldFlags {
  metadata?: { custom_fields?: CustomFieldDefinition[] } | null;
}

export interface CheckoutFormSources {
  organizationSettings?: {
    custom_fields?: CustomFieldDefinition[];
  } | null;
  paymentLink?: CheckoutFormSource | null;
  checkoutSession?: CheckoutFormSource | null;
}

const SYSTEM_FIELD_ORDER: Record<SystemCheckoutFieldKey, number> = {
  name: 0,
  email: 10,
  phone: 20,
  whatsapp: 30,
  billing_address: 40,
};

function resolveBooleanFlag(
  sessionValue: boolean | null | undefined,
  linkValue: boolean | null | undefined,
  fallback: boolean,
): boolean {
  if (sessionValue != null) return sessionValue;
  if (linkValue != null) return linkValue;
  return fallback;
}

function requireFlagToEmailVisibility(
  required: boolean,
): CheckoutFieldVisibility {
  return required ? 'required' : 'hidden';
}

function requireFlagToPhoneVisibility(
  required: boolean,
): CheckoutFieldVisibility {
  return required ? 'required' : 'optional';
}

function requireFlagToBillingVisibility(
  required: boolean,
): CheckoutFieldVisibility {
  return required ? 'required' : 'hidden';
}

function customFieldToVisibility(
  field: CustomFieldDefinition,
): CheckoutFieldVisibility {
  return field.required ? 'required' : 'optional';
}

function customFieldToUnified(
  field: CustomFieldDefinition,
  order: number,
): UnifiedCheckoutFieldDefinition {
  return {
    key: field.id,
    scope: 'custom',
    type: field.type,
    visibility: customFieldToVisibility(field),
    label: field.label,
    placeholder: field.placeholder,
    options: field.options,
    validation: field.validation,
    order,
  };
}

function resolveCustomFieldDefinitions(
  sources: CheckoutFormSources,
): CustomFieldDefinition[] {
  const sessionFields =
    sources.checkoutSession?.metadata?.custom_fields ??
    sources.paymentLink?.metadata?.custom_fields;
  if (sessionFields && sessionFields.length > 0) {
    return sessionFields;
  }
  return sources.organizationSettings?.custom_fields ?? [];
}

function clampContactVisibility(
  emailVisibility: CheckoutFieldVisibility,
  phoneVisibility: CheckoutFieldVisibility,
): {
  emailVisibility: CheckoutFieldVisibility;
  phoneVisibility: CheckoutFieldVisibility;
} {
  // Email visible: keep phone exactly as requested (optional or required).
  if (emailVisibility !== 'hidden') {
    return { emailVisibility, phoneVisibility };
  }

  // Email hidden: phone follows its own flag. A required phone stays required;
  // otherwise phone is hidden too, letting a merchant collect no contact field.
  return {
    emailVisibility,
    phoneVisibility: phoneVisibility === 'required' ? 'required' : 'hidden',
  };
}

export function resolveCheckoutForm(
  sources: CheckoutFormSources,
): ResolvedCheckoutForm {
  const requireBillingAddress = resolveBooleanFlag(
    sources.checkoutSession?.require_billing_address,
    sources.paymentLink?.require_billing_address,
    false,
  );

  const requireEmailFlag = resolveBooleanFlag(
    sources.checkoutSession?.require_email,
    sources.paymentLink?.require_email,
    true,
  );

  const requirePhoneFlag = resolveBooleanFlag(
    sources.checkoutSession?.require_phone,
    sources.paymentLink?.require_phone,
    true,
  );

  const requireNameFlag = resolveBooleanFlag(
    sources.checkoutSession?.require_name,
    sources.paymentLink?.require_name,
    true,
  );

  let emailVisibility = requireFlagToEmailVisibility(requireEmailFlag);
  let phoneVisibility = requireFlagToPhoneVisibility(requirePhoneFlag);

  ({ emailVisibility, phoneVisibility } = clampContactVisibility(
    emailVisibility,
    phoneVisibility,
  ));

  const billingVisibility = requireFlagToBillingVisibility(
    requireBillingAddress,
  );

  const nameVisibility = requireFlagToEmailVisibility(requireNameFlag);

  const customFieldDefinitions = resolveCustomFieldDefinitions(sources);

  const systemFields: UnifiedCheckoutFieldDefinition[] = [
    {
      key: 'name',
      scope: 'system',
      type: 'text',
      visibility: nameVisibility,
      order: SYSTEM_FIELD_ORDER.name,
    },
    {
      key: 'email',
      scope: 'system',
      type: 'email',
      visibility: emailVisibility,
      order: SYSTEM_FIELD_ORDER.email,
    },
    {
      key: 'phone',
      scope: 'system',
      type: 'tel',
      visibility: phoneVisibility,
      order: SYSTEM_FIELD_ORDER.phone,
    },
    {
      key: 'billing_address',
      scope: 'system',
      type: 'address_group',
      visibility: billingVisibility,
      order: SYSTEM_FIELD_ORDER.billing_address,
    },
  ];

  const customFields = customFieldDefinitions.map((field, index) =>
    customFieldToUnified(field, 100 + index),
  );

  const fields = [...systemFields, ...customFields].sort(
    (a, b) => a.order - b.order,
  );

  return {
    fields,
    requireBillingAddress: billingVisibility === 'required',
    requireEmail: emailVisibility === 'required',
    requirePhone: phoneVisibility === 'required',
    requireName: nameVisibility === 'required',
    showEmail: emailVisibility !== 'hidden',
    showPhone: phoneVisibility !== 'hidden',
    showName: nameVisibility !== 'hidden',
    customFields: customFieldDefinitions,
  };
}

export function normalizeCheckoutFieldFlags(input: {
  require_billing_address?: boolean;
  require_email?: boolean;
  require_phone?: boolean;
  require_name?: boolean;
  fields?: UnifiedCheckoutFieldDefinition[];
}): CheckoutFormFieldFlags {
  if (input.fields && input.fields.length > 0) {
    const systemFields = input.fields.filter(
      (field) => field.scope === 'system',
    );
    const nameField = systemFields.find((field) => field.key === 'name');
    const emailField = systemFields.find((field) => field.key === 'email');
    const phoneField = systemFields.find((field) => field.key === 'phone');
    const billingField = systemFields.find(
      (field) => field.key === 'billing_address',
    );

    return {
      require_billing_address: billingField?.visibility === 'required',
      require_email: emailField?.visibility === 'required',
      require_phone: phoneField?.visibility === 'required',
      require_name: nameField?.visibility === 'required',
    };
  }

  return {
    require_billing_address: input.require_billing_address,
    require_email: input.require_email,
    require_phone: input.require_phone,
    require_name: input.require_name,
  };
}
