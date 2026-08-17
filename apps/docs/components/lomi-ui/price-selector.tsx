'use client';

import * as React from 'react';

export interface PriceOption {
  price_id: string;
  amount: number;
  billing_interval?: string | null;
  is_active?: boolean;
  is_default?: boolean;
}

export interface PriceSelectorProps {
  prices: PriceOption[];
  selectedPriceId: string | null;
  onPriceSelect: (priceId: string) => void;
  currencyCode?: string;
  embedded?: boolean;
  /** Matches checkout.billing_cycle.choose_plan */
  label?: string;
  /** Matches checkout.billing_cycle.save */
  saveLabel?: string;
  className?: string;
}

const INTERVAL_LABELS = {
  day: 'day',
  week: 'week',
  'bi-weekly': 'bi-weekly',
  month: 'month',
  monthly: 'month',
  'bi-monthly': 'bi-monthly',
  quarterly: 'quarter',
  'semi-annual': 'semi-annual',
  year: 'year',
  yearly: 'year',
  lifetime: 'lifetime',
  unit: 'unit',
} as const;

function isIntervalLabelKey(
  interval: string,
): interval is keyof typeof INTERVAL_LABELS {
  return Object.hasOwn(INTERVAL_LABELS, interval);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatCurrency(amount: number, currency: string) {
  const locale = currency === 'XOF' ? 'fr-FR' : undefined;
  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });
  const displayCurrency = currency === 'XOF' ? 'F CFA' : currency;
  return `${formattedAmount} ${displayCurrency}`;
}

function formatBillingIntervalLabel(interval: string | null | undefined) {
  if (!interval) return 'month';
  return isIntervalLabelKey(interval) ? INTERVAL_LABELS[interval] : interval;
}

export function PriceSelector({
  prices,
  selectedPriceId,
  onPriceSelect,
  currencyCode = 'XOF',
  embedded = false,
  label = 'Choose your billing cycle',
  saveLabel = 'Save',
  className,
}: PriceSelectorProps) {
  const activePrices = prices.filter((price) => price.is_active !== false);

  if (activePrices.length <= 1) {
    return null;
  }

  const defaultPrice = activePrices.find((price) => price.is_default);
  const monthlyPrice = activePrices.find(
    (price) =>
      price.billing_interval === 'month' ||
      price.billing_interval === 'monthly',
  );

  const calculateSavings = (price: PriceOption) => {
    if (defaultPrice && defaultPrice.price_id !== price.price_id) {
      const savingsPercent = Math.round(
        ((defaultPrice.amount - price.amount) / defaultPrice.amount) * 100,
      );
      const savingsAmount = defaultPrice.amount - price.amount;

      if (savingsPercent > 0) {
        return { percent: savingsPercent, amount: savingsAmount };
      }
    }

    const isAnnualLike =
      price.billing_interval === 'year' || price.billing_interval === 'yearly';
    if (
      monthlyPrice &&
      isAnnualLike &&
      monthlyPrice.price_id !== price.price_id
    ) {
      const annualizedMonthly = monthlyPrice.amount * 12;
      const savingsAmount = annualizedMonthly - price.amount;
      if (savingsAmount > 0) {
        return {
          percent: Math.round((savingsAmount / annualizedMonthly) * 100),
          amount: savingsAmount,
        };
      }
    }

    return null;
  };

  return (
    <div className={cn('w-full space-y-2', !embedded && 'mb-4', className)}>
      <label className="block text-sm font-normal text-gray-400">{label}</label>

      <div className="space-y-1.5">
        {activePrices.map((price) => {
          const isSelected = price.price_id === selectedPriceId;
          const savings = calculateSavings(price);

          return (
            <button
              key={price.price_id}
              type="button"
              data-selected={isSelected ? 'true' : 'false'}
              onClick={() => onPriceSelect(price.price_id)}
              className={cn(
                'price-selector-option flex h-10 w-full items-center gap-2.5 rounded-sm bg-transparent px-3 text-left transition-colors duration-150 outline-none',
                isSelected
                  ? 'price-selector-option-selected border border-[#56A5F9]'
                  : 'border border-transparent',
              )}
            >
              <div
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                  isSelected ? 'border-[#56A5F9]' : 'border-gray-600',
                )}
              >
                {isSelected ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#56A5F9]" />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span className="font-medium text-gray-200">
                  {formatCurrency(price.amount, currencyCode)}
                </span>
                <span className="text-gray-400">
                  / {formatBillingIntervalLabel(price.billing_interval)}
                </span>
                {savings ? (
                  <span className="ml-auto shrink-0 text-xs text-green-400">
                    {saveLabel} {savings.percent}%
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
