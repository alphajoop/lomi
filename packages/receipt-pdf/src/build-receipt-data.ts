import {
  formatPhoneNumber,
  formatReceiptDate,
  formatSubscriptionStatus,
  stripEmojis,
} from "./format-utils";
import type {
  JsonObject,
  JsonValue,
  ReceiptBuildOptions,
  ReceiptDocumentData,
  ReceiptLineItem,
  ReceiptLineItemsResult,
  ReceiptTransactionInput,
} from "./types";

const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/dzrdlevfn/image/upload/v1757529912/git_vqxkbj.png";

function isJsonObject(value: JsonValue): value is JsonObject {
  return value !== null && !Array.isArray(value) && typeof value === "object";
}

function isString(value: JsonValue): value is string {
  return typeof value === "string";
}

function asMetadataRecord(metadata: JsonValue | undefined): JsonObject | null {
  return metadata !== undefined && isJsonObject(metadata) ? metadata : null;
}

function readMetadataString(
  metadata: JsonObject | null,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return value !== undefined && isString(value) ? value : undefined;
}

function resolveProductName(
  transaction: ReceiptTransactionInput,
  fallback: string,
): string {
  if (transaction.product_name && transaction.product_name !== "Item") {
    return transaction.product_name;
  }

  const metadata = asMetadataRecord(transaction.metadata);
  if (metadata) {
    const fromMeta =
      readMetadataString(metadata, "name") ||
      readMetadataString(metadata, "product_name");
    if (fromMeta) return fromMeta;
  }

  return fallback;
}

function resolveSubscriptionName(transaction: ReceiptTransactionInput): string {
  if (transaction.plan_name && transaction.plan_name !== "Item") {
    return transaction.plan_name;
  }

  const metadata = asMetadataRecord(transaction.metadata);
  return (
    readMetadataString(metadata, "plan_name") ||
    readMetadataString(metadata, "name") ||
    "Subscription"
  );
}

export function buildReceiptLineItems(
  transaction: ReceiptTransactionInput,
  isMerchantReceipt: boolean,
): ReceiptLineItemsResult {
  const items: ReceiptLineItem[] = [];
  let subtotal = 0;
  let platformFee = 0;

  const grossAmount = transaction.gross_amount ?? 0;
  const netAmount = transaction.net_amount ?? 0;

  if (
    transaction.product_id &&
    transaction.product_id !== "" &&
    transaction.product_name &&
    (transaction.product_price ?? 0) > 0
  ) {
    const quantity = transaction.quantity ?? 1;
    const unitPrice = transaction.product_price ?? 0;
    subtotal = unitPrice * quantity;

    if (subtotal === 0 && grossAmount > 0) {
      subtotal = grossAmount;
    }

    if (isMerchantReceipt) {
      if (netAmount > 0) {
        platformFee = subtotal - netAmount;
      } else {
        platformFee = grossAmount - subtotal;
      }
      if (platformFee < 0.01) platformFee = 0;
    }

    const productName = resolveProductName(transaction, "Product/Service");

    if (quantity > 1) {
      for (let i = 0; i < quantity; i++) {
        items.push({
          description: stripEmojis(productName),
          quantity: 1,
          unitPrice,
          amount: unitPrice,
          isFee: false,
        });
      }
    } else {
      items.push({
        description: stripEmojis(productName),
        quantity,
        unitPrice,
        amount: subtotal,
        isFee: false,
      });
    }
  } else if (transaction.subscription_id) {
    subtotal = grossAmount;

    if (isMerchantReceipt) {
      platformFee = netAmount > 0 ? subtotal - netAmount : 0;
    }

    items.push({
      description: stripEmojis(resolveSubscriptionName(transaction)),
      quantity: 1,
      unitPrice: subtotal,
      amount: subtotal,
      isFee: false,
    });
  } else if (transaction.product_name && grossAmount > 0) {
    const quantity = transaction.quantity ?? 1;
    const unitPrice = grossAmount / quantity;
    subtotal = grossAmount;

    if (isMerchantReceipt) {
      platformFee = netAmount > 0 ? subtotal - netAmount : 0;
    }

    const fallbackName = resolveProductName(transaction, "Service");

    if (quantity > 1) {
      for (let i = 0; i < quantity; i++) {
        items.push({
          description: stripEmojis(fallbackName),
          quantity: 1,
          unitPrice,
          amount: unitPrice,
          isFee: false,
        });
      }
    } else {
      items.push({
        description: stripEmojis(fallbackName),
        quantity,
        unitPrice,
        amount: grossAmount,
        isFee: false,
      });
    }
  } else {
    const quantity = transaction.quantity ?? 1;
    const unitPrice = grossAmount / quantity;
    subtotal = grossAmount;

    if (isMerchantReceipt) {
      platformFee = netAmount > 0 ? subtotal - netAmount : 0;
    }

    const paymentName = resolveProductName(transaction, "Payment/Service");

    if (quantity > 1) {
      for (let i = 0; i < quantity; i++) {
        items.push({
          description: stripEmojis(paymentName),
          quantity: 1,
          unitPrice,
          amount: unitPrice,
          isFee: false,
        });
      }
    } else {
      items.push({
        description: stripEmojis(paymentName),
        quantity: 1,
        unitPrice: grossAmount,
        amount: grossAmount,
        isFee: false,
      });
    }
  }

  if (isMerchantReceipt && platformFee > 0.01) {
    items.push({
      description: "Fees",
      quantity: 1,
      unitPrice: platformFee,
      amount: platformFee,
      isFee: true,
    });
  }

  return { items, subtotal, platformFee };
}

export function buildReceiptDocumentData(
  transaction: ReceiptTransactionInput,
  options: ReceiptBuildOptions,
): ReceiptDocumentData {
  const isMerchantReceipt = options.isMerchantReceipt ?? false;
  const currency =
    transaction.currency || transaction.currency_code || "XOF";
  const { items, subtotal, platformFee } = buildReceiptLineItems(
    transaction,
    isMerchantReceipt,
  );

  const showQuantityAndPrice = items.some(
    (item) => !item.isFee && item.quantity !== 1,
  );

  const totalAmount = isMerchantReceipt ? subtotal - platformFee : subtotal;
  const totalLabel = isMerchantReceipt ? "Amount received" : "Total paid";

  const logoUrl =
    options.organizationLogo &&
    options.organizationLogo !== DEFAULT_LOGO_URL
      ? options.organizationLogo
      : undefined;

  const formatBilling =
    options.formatBillingFrequency ??
    ((frequency) => frequency || "N/A");
  const formatStatus =
    options.formatSubscriptionStatus ?? formatSubscriptionStatus;

  const document: ReceiptDocumentData = {
    title: options.receiptTitle || "Receipt",
    transactionId: transaction.transaction_id,
    providerTransactionId: transaction.provider_transaction_id || undefined,
    date: formatReceiptDate(transaction.date || transaction.created_at),
    paymentMethod: options.formatPaymentMethod(transaction.provider_code),
    currency,
    from: {
      name: stripEmojis(options.organizationName || "lomi."),
      street: options.organizationStreet,
      city: options.organizationCity,
      region: options.organizationRegion,
      postalCode: options.organizationPostalCode,
      country: options.organizationCountry,
    },
    to: {
      name: stripEmojis(transaction.customer_name || "Valued Customer"),
      street: transaction.customer_address || undefined,
      city: transaction.customer_city || undefined,
      postalCode: transaction.customer_postal_code || undefined,
      country: transaction.customer_country || undefined,
      email: transaction.customer_email || undefined,
      phone: transaction.customer_phone
        ? formatPhoneNumber(transaction.customer_phone)
        : undefined,
    },
    lineItems: items,
    showQuantityAndPrice,
    totalAmount,
    totalLabel,
    logoUrl,
    isMerchantReceipt,
    subtotal,
    platformFee,
  };

  if (transaction.subscription_id) {
    document.subscription = {
      planName: stripEmojis(transaction.plan_name || "N/A"),
      billingFrequency: formatBilling(transaction.plan_billing_frequency),
      nextBillingDate: formatReceiptDate(
        transaction.subscription_next_billing_date,
      ),
      status: formatStatus(transaction.subscription_status),
    };
  }

  return document;
}
