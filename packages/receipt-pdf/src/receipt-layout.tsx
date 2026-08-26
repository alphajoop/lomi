import type { ReactNode } from "react";
import { formatAddressLines, formatContactLines } from "./format-address";
import { formatCurrencyForReceipt } from "./format-utils";
import {
  HtmlContactLine,
  HtmlDocumentBand,
  HtmlDocumentHeader,
  HtmlLegalFooter,
  HtmlMetaRow,
  HtmlSectionLabel,
} from "./html-chrome";
import { resolveSupportEmail } from "./legal";
import { PDF_BAND_RECEIPT } from "./tokens";
import type { ReceiptDocumentData, ReceiptLayoutLabels } from "./types";

function truncateId(id: string, maxLength = 20): string {
  if (id.length <= maxLength) return id;
  return `${id.slice(0, maxLength)}…`;
}

function AddressSection({
  label,
  address,
}: {
  label: string;
  address: ReceiptDocumentData["from"];
}) {
  const addressLines = formatAddressLines(address);
  const contactLines = formatContactLines(address);

  return (
    <div>
      <HtmlSectionLabel>{label}</HtmlSectionLabel>
      <p className="text-[11px] font-semibold text-foreground">
        {address.name}
      </p>
      {addressLines.map((line) => (
        <p key={line} className="text-[11px] text-[#6B7280] leading-5">
          {line}
        </p>
      ))}
      {contactLines.map((line) => (
        <p key={line} className="text-[11px] text-[#6B7280] leading-5">
          {line}
        </p>
      ))}
    </div>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 text-[11px]">
      <span className="font-semibold text-foreground shrink-0">{label}</span>
      <span className="text-muted-foreground text-right break-all">
        {value}
      </span>
    </div>
  );
}

export function ReceiptLayout({
  data,
  labels,
  actions,
}: {
  data: ReceiptDocumentData;
  labels: ReceiptLayoutLabels;
  actions?: ReactNode;
}) {
  const supportEmail = resolveSupportEmail(data.from.email);

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden relative">
      <HtmlDocumentBand color={PDF_BAND_RECEIPT} />
      <div className="px-6 md:px-8 pt-10 pb-6 bg-white dark:bg-card">
        <HtmlDocumentHeader title={data.title}>
          <HtmlMetaRow
            label={labels.receiptId}
            value={truncateId(data.transactionId)}
          />
          <HtmlMetaRow label={labels.date} value={data.date} />
          <HtmlMetaRow
            label={labels.paymentMethod}
            value={data.paymentMethod}
          />
        </HtmlDocumentHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <AddressSection label={labels.billedBy} address={data.from} />
          <AddressSection label={labels.billedTo} address={data.to} />
        </div>

        {data.providerTransactionId ? (
          <div className="mb-6">
            <DetailPair
              label={labels.transactionId}
              value={data.providerTransactionId}
            />
          </div>
        ) : null}

        <div className="mt-5">
          <div
            className={`grid ${data.showQuantityAndPrice ? "grid-cols-[1.5fr_12%_12%_15%]" : "grid-cols-[1.5fr_15%]"} gap-4 items-end pb-1 mb-2 border-b border-[#111111]`}
          >
            <div className="text-[11px] text-[#878787]">
              {labels.description}
            </div>
            {data.showQuantityAndPrice ? (
              <div className="text-[11px] text-[#878787]">
                {labels.quantity}
              </div>
            ) : null}
            {data.showQuantityAndPrice ? (
              <div className="text-[11px] text-[#878787]">{labels.price}</div>
            ) : null}
            <div className="text-[11px] text-[#878787] text-right">
              {labels.amount}
            </div>
          </div>

          {data.lineItems.map((item, index) => (
            <div
              key={`${item.description}-${index.toString()}`}
              className={`grid ${data.showQuantityAndPrice ? "grid-cols-[1.5fr_12%_12%_15%]" : "grid-cols-[1.5fr_15%]"} gap-4 items-start py-2 border-b border-[#E2E8F0]`}
            >
              <div className="text-[11px] text-foreground self-start font-semibold">
                {item.description}
              </div>
              {data.showQuantityAndPrice ? (
                <div className="text-[11px] text-foreground self-start">
                  {!item.isFee ? item.quantity : ""}
                </div>
              ) : null}
              {data.showQuantityAndPrice ? (
                <div className="text-[11px] text-foreground self-start">
                  {!item.isFee
                    ? formatCurrencyForReceipt(item.unitPrice, data.currency)
                    : ""}
                </div>
              ) : null}
              <div className="text-[11px] text-foreground text-right self-start">
                {formatCurrencyForReceipt(item.amount, data.currency)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <div className="w-full max-w-[320px]">
            {data.isMerchantReceipt &&
            data.platformFee &&
            data.platformFee > 0.01 ? (
              <>
                {labels.subtotal ? (
                  <div className="flex justify-between text-[11px] mb-2 text-[#878787]">
                    <span>{labels.subtotal}</span>
                    <span>
                      {formatCurrencyForReceipt(
                        data.subtotal ?? 0,
                        data.currency,
                      )}
                    </span>
                  </div>
                ) : null}
                {labels.fees ? (
                  <div className="flex justify-between text-[11px] mb-2">
                    <span>{labels.fees}</span>
                    <span>
                      -{" "}
                      {formatCurrencyForReceipt(
                        data.platformFee,
                        data.currency,
                      )}
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex justify-between items-center border-t border-[#111111] pt-2">
              <span className="text-[11px] font-semibold">
                {data.totalLabel}
              </span>
              <span className="text-[21px] font-semibold">
                {formatCurrencyForReceipt(data.totalAmount, data.currency)}
              </span>
            </div>
            <HtmlContactLine email={supportEmail} kind="receipt" />
          </div>
        </div>

        {data.subscription ? (
          <div className="mt-8 p-4 border border-[#E2E8F0] text-[11px]">
            <p className="font-semibold mb-3">Subscription details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailPair label="Plan" value={data.subscription.planName} />
              <DetailPair
                label="Next billing"
                value={data.subscription.nextBillingDate}
              />
              <DetailPair
                label="Billing frequency"
                value={data.subscription.billingFrequency}
              />
              <DetailPair label="Status" value={data.subscription.status} />
            </div>
          </div>
        ) : null}

        <HtmlLegalFooter />

        {actions ? <div className="mt-6 pt-4">{actions}</div> : null}
      </div>
    </div>
  );
}
