import {
  handleSupabaseRpc,
  isBoolean,
  isJsonObject,
  readBoolean,
  readNumber,
  readObject,
  readString,
  validateJsonValue,
  type JsonObject,
  type JsonValue,
} from "@lomi./shared";
import { rpc } from "./rpc.js";
import type { TypedSupabaseClient } from "./types.js";

export type CustomerNotificationChannel = {
  email: boolean;
  whatsapp: boolean;
};

export type SubscriptionRenewalNotifications = CustomerNotificationChannel & {
  days_before: number;
  max_attempts: number;
};

export type CustomerNotifications = {
  new_payment_links: CustomerNotificationChannel;
  successful_payment_attempts: CustomerNotificationChannel;
  subscription_renewals: SubscriptionRenewalNotifications;
  subscription_updates: CustomerNotificationChannel;
  invoices: CustomerNotificationChannel;
  payment_reminders: CustomerNotificationChannel;
};

export type MerchantPostTransactionNotifications = {
  email: boolean;
  whatsapp: boolean;
};

export type PrimaryPaymentNotificationContact = {
  email: string;
  name: string;
} | null;

export type CheckoutSettings = {
  organization_id: string;
  default_language: string;
  default_currency: string;
  payment_link_duration: number;
  fee_types: Array<{
    id: string | null;
    name: string;
    enabled: boolean;
    percentage: number;
    fixedAmount?: number | null;
    apply_once_per_order?: boolean;
    apply_to_direct_charges?: boolean;
  }>;
  customer_notifications: CustomerNotifications;
  merchant_post_transaction_notifications?: MerchantPostTransactionNotifications;
  primary_payment_notification_contact?: PrimaryPaymentNotificationContact;
  merchant_recipients: Array<{
    email: string;
    notification: "all" | "important";
  }>;
  default_success_url: string;
  default_cancel_url: string;
  pay_button_bg_color: string;
  custom_domain?: string | null;
  custom_domain_verified?: boolean;
  custom_domain_active?: boolean;
  meta_pixel_id?: string | null;
  ga4_measurement_id?: string | null;
  default_allow_coupon_code?: boolean;
  apple_pay_enabled?: boolean;
  google_pay_enabled?: boolean;
  pass_processing_fees_to_customer?: boolean;
};

const CUSTOMER_NOTIFICATION_ROW_TYPES: Array<
  Exclude<keyof CustomerNotifications, "subscription_renewals">
> = [
  "new_payment_links",
  "successful_payment_attempts",
  "subscription_updates",
  "invoices",
  "payment_reminders",
];

const DEFAULT_CUSTOMER_NOTIFICATIONS: CustomerNotifications = {
  new_payment_links: { email: true, whatsapp: false },
  successful_payment_attempts: { email: true, whatsapp: false },
  subscription_updates: { email: true, whatsapp: false },
  invoices: { email: true, whatsapp: false },
  payment_reminders: { email: true, whatsapp: false },
  subscription_renewals: {
    email: true,
    whatsapp: false,
    days_before: 3,
    max_attempts: 3,
  },
};

const DEFAULT_MERCHANT_POST_TRANSACTION_NOTIFICATIONS: MerchantPostTransactionNotifications =
  {
    email: true,
    whatsapp: false,
  };

function readOptionalInteger(
  object: JsonObject,
  key: string,
): number | undefined {
  const numeric = readNumber(object, key);
  if (numeric !== undefined) return numeric;
  const text = readString(object, key);
  if (text === undefined) return undefined;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNotificationChannel(
  value: JsonValue | undefined,
  defaults: CustomerNotificationChannel,
): CustomerNotificationChannel {
  const object = isJsonObject(value) ? value : undefined;
  if (!object) return { ...defaults };
  return {
    email: readBoolean(object, "email") ?? defaults.email,
    whatsapp: readBoolean(object, "whatsapp") ?? defaults.whatsapp,
  };
}

function parseSubscriptionRenewalNotifications(
  value: JsonValue | undefined,
  defaults: SubscriptionRenewalNotifications = DEFAULT_CUSTOMER_NOTIFICATIONS.subscription_renewals,
): SubscriptionRenewalNotifications {
  const object = isJsonObject(value) ? value : undefined;
  if (!object) return { ...defaults };
  return {
    email: readBoolean(object, "email") ?? defaults.email,
    whatsapp: readBoolean(object, "whatsapp") ?? defaults.whatsapp,
    days_before:
      readOptionalInteger(object, "days_before") ?? defaults.days_before,
    max_attempts:
      readOptionalInteger(object, "max_attempts") ?? defaults.max_attempts,
  };
}

function normalizeMerchantPostTransactionNotifications(
  raw: JsonValue | undefined,
): MerchantPostTransactionNotifications {
  return parseNotificationChannel(
    raw,
    DEFAULT_MERCHANT_POST_TRANSACTION_NOTIFICATIONS,
  );
}

function normalizeCustomerNotifications(
  raw: JsonValue | undefined,
): CustomerNotifications {
  const object = isJsonObject(raw) ? raw : undefined;
  const result: CustomerNotifications = { ...DEFAULT_CUSTOMER_NOTIFICATIONS };

  if (!object) return result;

  for (const key of CUSTOMER_NOTIFICATION_ROW_TYPES) {
    result[key] = parseNotificationChannel(
      object[key],
      DEFAULT_CUSTOMER_NOTIFICATIONS[key],
    );
  }

  result.subscription_renewals = parseSubscriptionRenewalNotifications(
    object["subscription_renewals"],
  );

  for (const key of ["invoices", "payment_reminders"] as const) {
    result[key] = parseNotificationChannel(
      object[key],
      DEFAULT_CUSTOMER_NOTIFICATIONS[key],
    );
  }

  return result;
}

function parsePrimaryPaymentNotificationContact(
  value: JsonValue | undefined,
): PrimaryPaymentNotificationContact {
  const object = isJsonObject(value) ? value : undefined;
  if (!object) return null;
  return {
    email: readString(object, "email") ?? "",
    name: readString(object, "name") ?? "",
  };
}

export function parseCheckoutSettings(
  raw: JsonValue,
  organizationId: string,
): CheckoutSettings | null {
  if (!isJsonObject(raw)) return null;

  return {
    organization_id: organizationId,
    default_language: readString(raw, "default_language") ?? "en",
    default_currency: readString(raw, "default_currency") ?? "XOF",
    payment_link_duration: readNumber(raw, "payment_link_duration") ?? 1,
    fee_types: [],
    customer_notifications: normalizeCustomerNotifications(
      readObject(raw, "customer_notifications"),
    ),
    merchant_post_transaction_notifications:
      normalizeMerchantPostTransactionNotifications(
        readObject(raw, "merchant_post_transaction_notifications"),
      ),
    primary_payment_notification_contact:
      parsePrimaryPaymentNotificationContact(
        readObject(raw, "primary_payment_notification_contact") ??
          raw["primary_payment_notification_contact"],
      ),
    merchant_recipients: [],
    default_success_url: readString(raw, "default_success_url") ?? "",
    default_cancel_url: readString(raw, "default_cancel_url") ?? "",
    pay_button_bg_color: readString(raw, "pay_button_bg_color") ?? "#121317",
    meta_pixel_id: readString(raw, "meta_pixel_id") ?? null,
    ga4_measurement_id: readString(raw, "ga4_measurement_id") ?? null,
    default_allow_coupon_code:
      readBoolean(raw, "default_allow_coupon_code") ??
      readBoolean(raw, "display_coupon_field") ??
      false,
    apple_pay_enabled: readBoolean(raw, "apple_pay_enabled") ?? false,
    google_pay_enabled: readBoolean(raw, "google_pay_enabled") ?? false,
    pass_processing_fees_to_customer:
      readBoolean(raw, "pass_processing_fees_to_customer") ?? false,
  };
}

export function buildCheckoutSettingsFieldPatch(
  field: string,
  value: string | number | boolean,
): Partial<CheckoutSettings> {
  switch (field) {
    case "default_language":
      return { default_language: String(value) };
    case "default_currency":
      return { default_currency: String(value) };
    case "payment_link_duration":
      return { payment_link_duration: Number(value) };
    case "default_success_url":
      return { default_success_url: String(value) };
    case "default_cancel_url":
      return { default_cancel_url: String(value) };
    case "pay_button_bg_color":
      return { pay_button_bg_color: String(value) };
    case "meta_pixel_id":
      return { meta_pixel_id: String(value) };
    case "ga4_measurement_id":
      return { ga4_measurement_id: String(value) };
    case "default_allow_coupon_code":
      return {
        default_allow_coupon_code: isBoolean(value) ? value : Boolean(value),
      };
    case "apple_pay_enabled":
      return { apple_pay_enabled: isBoolean(value) ? value : Boolean(value) };
    case "google_pay_enabled":
      return { google_pay_enabled: isBoolean(value) ? value : Boolean(value) };
    case "pass_processing_fees_to_customer":
      return {
        pass_processing_fees_to_customer: isBoolean(value)
          ? value
          : Boolean(value),
      };
    default:
      return {};
  }
}

export async function fetchOrganizationCheckoutSettings(
  client: TypedSupabaseClient,
  organizationId: string,
): Promise<CheckoutSettings | null> {
  const data = await handleSupabaseRpc(
    rpc(client, "fetch_organization_checkout_settings", {
      p_organization_id: organizationId,
    }),
    "fetch_organization_checkout_settings",
    null,
  );
  if (data === null) return null;
  return parseCheckoutSettings(validateJsonValue(data), organizationId);
}

/** Unparsed checkout settings JSON — for call sites that need fields outside CheckoutSettings. */
export async function fetchOrganizationCheckoutSettingsRaw(
  client: TypedSupabaseClient,
  organizationId: string,
): Promise<JsonValue | null> {
  const data = await handleSupabaseRpc(
    rpc(client, "fetch_organization_checkout_settings", {
      p_organization_id: organizationId,
    }),
    "fetch_organization_checkout_settings",
    null,
  );
  if (data === null) return null;
  return validateJsonValue(data);
}

export async function updateOrganizationCheckoutSettings(
  client: TypedSupabaseClient,
  organizationId: string,
  settings: Partial<CheckoutSettings>,
  actingMerchantId?: string,
): Promise<boolean> {
  const success = await handleSupabaseRpc(
    rpc(client, "update_organization_checkout_settings", {
      p_organization_id: organizationId,
      p_settings: validateJsonValue(settings),
      p_acting_merchant_id: actingMerchantId,
    }),
    "update_organization_checkout_settings",
    { expectReturnValue: false },
  );
  return success === true;
}

export * from "./checkout-settings-ops.js";
