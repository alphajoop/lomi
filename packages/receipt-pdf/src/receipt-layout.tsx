import type { ReactNode } from "react";
import { formatAddressLines, formatContactLines } from "./format-address";
import { formatCurrencyForReceipt } from "./format-utils";
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
      <p className="text-[11px] text-[#878787] mb-2">{label}</p>
      <p className="text-[11px] font-semibold text-foreground">{address.name}</p>
      {addressLines.map((line) => (
        <p key={line} className="text-[11px] text-muted-foreground leading-5">
          {line}
        </p>
      ))}
      {contactLines.map((line) => (
        <p key={line} className="text-[11px] text-muted-foreground leading-5">
          {line}
        </p>
      ))}
    </div>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 text-[11px]">
      <span className="font-medium text-foreground shrink-0">{label}</span>
      <span className="text-muted-foreground text-right break-all">{value}</span>
    </div>
  );
}

export function ReceiptLayout({
  data,
  labels,
  organizationBadge,
  actions,
}: {
  data: ReceiptDocumentData;
  labels: ReceiptLayoutLabels;
  organizationBadge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="p-6 md:p-8 bg-white dark:bg-card">
        {organizationBadge ? (
          <div className="flex justify-center mb-6">{organizationBadge}</div>
        ) : null}

        <div className="mb-6">
          <h1 className="text-[21px] font-medium text-foreground mb-2 leading-tight text-center">
            {data.title}
          </h1>
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground text-center">
            <p>
              <span className="text-[#878787]">{labels.receiptId}:</span>{" "}
              <span title={data.transactionId}>
                {truncateId(data.transactionId)}
              </span>
            </p>
            <p>
              <span className="text-[#878787]">{labels.date}:</span> {data.date}
            </p>
            <p>
              <span className="text-[#878787]">{labels.paymentMethod}:</span>{" "}
              {data.paymentMethod}
            </p>
          </div>
        </div>

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

        <div className="mt-5 font-mono">
          <div
            className={`grid ${data.showQuantityAndPrice ? "grid-cols-[1.5fr_12%_12%_15%]" : "grid-cols-[1.5fr_15%]"} gap-4 items-end pb-1 mb-2 border-b border-border`}
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
              className={`grid ${data.showQuantityAndPrice ? "grid-cols-[1.5fr_12%_12%_15%]" : "grid-cols-[1.5fr_15%]"} gap-4 items-start py-2 border-b border-border/60`}
            >
              <div className="text-[11px] text-foreground self-start">
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
          <div className="w-full max-w-[250px]">
            {data.isMerchantReceipt &&
            data.platformFee &&
            data.platformFee > 0.01 ? (
              <>
                {labels.subtotal ? (
                  <div className="flex justify-between text-[11px] mb-2">
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
                  <div className="flex justify-between text-[11px] mb-2 text-red-600 dark:text-red-400">
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
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-[11px]">{data.totalLabel}</span>
              <span className="text-[21px]">
                {formatCurrencyForReceipt(data.totalAmount, data.currency)}
              </span>
            </div>
          </div>
        </div>

        {data.subscription ? (
          <div className="mt-8 p-4 border border-border rounded-sm text-[11px]">
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

        {actions ? (
          <div className="mt-6 pt-4 border-t border-border">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
