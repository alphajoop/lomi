import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { formatAddressLines, formatContactLines } from "./format-address";
import { formatCurrencyForReceipt } from "./format-utils";
import { registerReceiptFonts } from "./fonts";
import {
  PDF_BACKGROUND,
  PDF_BORDER_COLOR,
  PDF_FONT_SIZE,
  PDF_LABEL_COLOR,
  PDF_PAGE_PADDING,
  PDF_TEXT_COLOR,
} from "./tokens";
import type { ReceiptAddress, ReceiptDocumentData } from "./types";

registerReceiptFonts();

function AddressBlock({
  label,
  address,
}: {
  label: string;
  address: ReceiptAddress;
}) {
  const addressLines = formatAddressLines(address);
  const contactLines = formatContactLines(address);

  return (
    <View style={{ flex: 1, marginBottom: 20 }}>
      <Text
        style={{
          fontSize: PDF_FONT_SIZE.label,
          fontWeight: 500,
          color: PDF_LABEL_COLOR,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: PDF_FONT_SIZE.body,
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {address.name}
      </Text>
      {addressLines.map((line, index) => (
        <Text
          key={`addr-${index.toString()}`}
          style={{
            fontSize: PDF_FONT_SIZE.body,
            lineHeight: 1.4,
            marginBottom: 2,
          }}
        >
          {line}
        </Text>
      ))}
      {contactLines.map((line, index) => (
        <Text
          key={`contact-${index.toString()}`}
          style={{
            fontSize: PDF_FONT_SIZE.body,
            lineHeight: 1.4,
            marginBottom: 2,
            color: PDF_LABEL_COLOR,
          }}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
      }}
    >
      <Text style={{ fontSize: PDF_FONT_SIZE.label, fontWeight: 500 }}>
        {label}
      </Text>
      <Text style={{ fontSize: PDF_FONT_SIZE.label, maxWidth: "55%" }}>
        {value}
      </Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "#22c55e";
    case "cancelled":
      return "#ef4444";
    case "suspended":
    case "paused":
      return "#eab308";
    case "pending":
      return "#3b82f6";
    default:
      return "#9ca3af";
  }
}

export function ReceiptPdfDocument({ data }: { data: ReceiptDocumentData }) {
  const currentYear = new Date().getFullYear();

  return (
    <Document>
      <Page
        wrap
        size="A4"
        style={{
          padding: PDF_PAGE_PADDING,
          backgroundColor: PDF_BACKGROUND,
          color: PDF_TEXT_COLOR,
          fontFamily: "Inter",
          fontWeight: 400,
        }}
      >
        <View
          style={{
            marginBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, minWidth: 0, marginRight: 20 }}>
            <Text
              style={{
                fontSize: PDF_FONT_SIZE.title,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              {data.title}
            </Text>
            <View style={{ flexDirection: "column", gap: 4 }}>
              <Text style={{ fontSize: PDF_FONT_SIZE.label }}>
                Receipt ID: {data.transactionId}
              </Text>
              <Text style={{ fontSize: PDF_FONT_SIZE.label }}>
                Date: {data.date}
              </Text>
              <Text style={{ fontSize: PDF_FONT_SIZE.label }}>
                Payment method: {data.paymentMethod}
              </Text>
            </View>
          </View>

          {data.logoUrl ? (
            <View style={{ maxWidth: 220, flexShrink: 0 }}>
              <Image
                src={data.logoUrl}
                style={{ height: 72, objectFit: "contain" }}
              />
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", marginTop: 12 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <AddressBlock label="Billed by" address={data.from} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <AddressBlock label="Billed to" address={data.to} />
          </View>
        </View>

        {data.providerTransactionId ? (
          <View style={{ marginBottom: 16 }}>
            <DetailRow
              label="Transaction ID"
              value={data.providerTransactionId}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 0.5,
              borderBottomColor: PDF_BORDER_COLOR,
              paddingBottom: 5,
              marginBottom: 5,
            }}
          >
            <Text style={{ flex: 3, fontSize: PDF_FONT_SIZE.label, fontWeight: 500 }}>
              Description
            </Text>
            {data.showQuantityAndPrice ? (
              <Text
                style={{ flex: 1, fontSize: PDF_FONT_SIZE.label, fontWeight: 500 }}
              >
                Qty
              </Text>
            ) : null}
            {data.showQuantityAndPrice ? (
              <Text
                style={{ flex: 1, fontSize: PDF_FONT_SIZE.label, fontWeight: 500 }}
              >
                Price
              </Text>
            ) : null}
            <Text
              style={{
                flex: 1,
                fontSize: PDF_FONT_SIZE.label,
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              Amount
            </Text>
          </View>

          {data.lineItems.map((item, index) => (
            <View
              key={`line-${index.toString()}`}
              wrap={false}
              style={{
                flexDirection: "row",
                paddingVertical: 5,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 3, paddingRight: 16 }}>
                <Text style={{ fontSize: PDF_FONT_SIZE.body }}>
                  {item.description}
                </Text>
              </View>
              {data.showQuantityAndPrice ? (
                <Text style={{ flex: 1, fontSize: PDF_FONT_SIZE.body }}>
                  {!item.isFee ? String(item.quantity) : ""}
                </Text>
              ) : null}
              {data.showQuantityAndPrice ? (
                <Text style={{ flex: 1, fontSize: PDF_FONT_SIZE.body }}>
                  {!item.isFee
                    ? formatCurrencyForReceipt(item.unitPrice, data.currency)
                    : ""}
                </Text>
              ) : null}
              <Text
                style={{
                  flex: 1,
                  fontSize: PDF_FONT_SIZE.body,
                  textAlign: "right",
                }}
              >
                {formatCurrencyForReceipt(item.amount, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 32,
            alignItems: "flex-end",
            marginLeft: "auto",
            width: 250,
          }}
        >
          {data.isMerchantReceipt &&
          data.platformFee &&
          data.platformFee > 0.01 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 5,
                  width: "100%",
                }}
              >
                <Text style={{ fontSize: PDF_FONT_SIZE.label, flex: 1 }}>
                  Subtotal
                </Text>
                <Text style={{ fontSize: PDF_FONT_SIZE.label, textAlign: "right" }}>
                  {formatCurrencyForReceipt(data.subtotal ?? 0, data.currency)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 5,
                  width: "100%",
                }}
              >
                <Text style={{ fontSize: PDF_FONT_SIZE.label, flex: 1 }}>
                  Fees
                </Text>
                <Text style={{ fontSize: PDF_FONT_SIZE.label, textAlign: "right" }}>
                  -{" "}
                  {formatCurrencyForReceipt(data.platformFee, data.currency)}
                </Text>
              </View>
            </>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              marginTop: 5,
              borderTopWidth: 0.5,
              borderTopColor: PDF_BORDER_COLOR,
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 5,
              width: "100%",
            }}
          >
            <Text style={{ fontSize: PDF_FONT_SIZE.label, marginRight: 10 }}>
              {data.totalLabel}
            </Text>
            <Text style={{ fontSize: PDF_FONT_SIZE.total }}>
              {formatCurrencyForReceipt(data.totalAmount, data.currency)}
            </Text>
          </View>
        </View>

        {data.subscription ? (
          <View
            wrap={false}
            style={{
              marginTop: 24,
              padding: 12,
              borderWidth: 0.5,
              borderColor: "#e2e8f0",
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: PDF_FONT_SIZE.label,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Subscription details
            </Text>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <DetailRow label="Plan" value={data.subscription.planName} />
                <DetailRow
                  label="Billing frequency"
                  value={data.subscription.billingFrequency}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <DetailRow
                  label="Next billing"
                  value={data.subscription.nextBillingDate}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: PDF_FONT_SIZE.label, fontWeight: 500 }}>
                    Status
                  </Text>
                  <Text
                    style={{
                      fontSize: PDF_FONT_SIZE.label,
                      color: getStatusColor(data.subscription.status),
                    }}
                  >
                    {data.subscription.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <View
          style={{
            position: "absolute",
            bottom: PDF_PAGE_PADDING,
            left: PDF_PAGE_PADDING,
            right: PDF_PAGE_PADDING,
            borderTopWidth: 0.5,
            borderTopColor: "#e2e8f0",
            paddingTop: 10,
          }}
        >
          <Text
            style={{
              fontSize: PDF_FONT_SIZE.footer,
              color: PDF_LABEL_COLOR,
              textAlign: "right",
              marginBottom: 4,
            }}
          >
            Please contact hello@lomi.africa with any questions regarding this
            receipt.
          </Text>
          <Text style={{ fontSize: PDF_FONT_SIZE.footer, color: PDF_LABEL_COLOR }}>
            Powered by lomi. | © {currentYear} lomi. Technology Africa S.A.R.L.
            — All rights reserved
          </Text>
        </View>
      </Page>
    </Document>
  );
}
