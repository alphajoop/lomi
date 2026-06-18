/* eslint-disable @next/next/no-img-element -- Lomi UI registry components are framework-portable copy-paste components. */

import * as React from 'react';

export interface CheckoutSummaryItem {
  name: string;
  quantity?: number;
  amount: number;
  unitAmount?: number;
  imageUrl?: string;
}

export interface CheckoutSummaryFee {
  name: string;
  amount: number;
  label?: string;
}

export interface CheckoutSummaryCardProps {
  /** Product or payment link title shown above the price. */
  title: string;
  items?: CheckoutSummaryItem[];
  subtotal: number;
  fees?: number | CheckoutSummaryFee[];
  discount?: number;
  total: number;
  currency: string;
  description?: string;
  productImageUrl?: string;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeFees(
  fees: number | CheckoutSummaryFee[] | undefined,
): CheckoutSummaryFee[] {
  if (!fees) return [];
  if (typeof fees === 'number') {
    return fees > 0 ? [{ name: 'Fees', amount: fees }] : [];
  }
  return fees.filter((fee) => fee.amount > 0);
}

export function CheckoutSummaryCard({
  title,
  items = [],
  subtotal,
  fees,
  discount = 0,
  total,
  currency,
  description,
  productImageUrl,
  className,
}: CheckoutSummaryCardProps) {
  const feeRows = normalizeFees(fees);
  const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const showCart = items.length > 1;

  return (
    <aside
      className={cn(
        'w-full max-w-[488px] p-4 text-white select-none lg:p-8',
        className,
      )}
      style={{ backgroundColor: '#121317' }}
    >
      {showCart ? (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-lg font-medium text-white">Your Cart</h3>
            <span className="text-sm text-gray-400">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2 scrollbar-thin">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-start gap-4 rounded-lg border border-gray-800 bg-gray-900/50 p-3 transition-colors hover:border-gray-700"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-white">
                    {item.name}
                  </h4>
                  {item.unitAmount ? (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatAmount(item.unitAmount)} {currency} each
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Qty: {item.quantity ?? 1}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {formatAmount(item.amount)}
                      </span>
                      <span className="ml-1 text-sm text-gray-400">
                        {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Subtotal</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium text-white">
                  {formatAmount(subtotal)}
                </span>
                <span className="text-gray-400">{currency}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-12">
          <h2 className="mb-4 text-xl text-gray-300">{title}</h2>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold">
              {formatAmount(total)}
            </span>
            <span className="text-4xl">{currency}</span>
          </div>
          {(description || productImageUrl || items[0]?.imageUrl) && (
            <div className="flex items-start gap-2 border-t border-gray-800 pt-4">
              {(productImageUrl || items[0]?.imageUrl) && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-gray-800">
                  <img
                    src={productImageUrl ?? items[0]?.imageUrl}
                    alt={items[0]?.name ?? title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {description ? (
                <div className="max-h-40 overflow-y-auto whitespace-pre-line text-sm text-gray-400">
                  {description}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {!showCart ? (
        <div className="space-y-2">
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400">Subtotal</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg">{formatAmount(subtotal)}</span>
                <span className="text-lg text-gray-400">{currency}</span>
              </div>
            </div>

            {feeRows.map((fee) => (
              <div
                key={fee.name}
                className="flex items-baseline justify-between pt-2"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-400">{fee.name}</span>
                  {fee.label ? (
                    <span className="text-xs text-gray-500">({fee.label})</span>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400">
                    {formatAmount(fee.amount)}
                  </span>
                  <span className="text-gray-500">{currency}</span>
                </div>
              </div>
            ))}

            {discount > 0 ? (
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-gray-400">Discount</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400">
                    -{formatAmount(discount)}
                  </span>
                  <span className="text-gray-500">{currency}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="font-normal text-white">Total due today</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-normal">
                  {formatAmount(total)}
                </span>
                <span className="text-lg text-gray-400">{currency}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
