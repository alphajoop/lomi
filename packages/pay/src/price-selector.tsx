"use client";

import React from "react";
import { Label } from "@lomi./ui/label";
import { cn } from "@lomi./ui/cn";
import type { TranslateFn } from "./types";

export interface PayPriceOption {
  price_id: string;
  amount: number;
  currency_code?: string;
  billing_interval?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

interface PriceSelectorProps {
  t: TranslateFn;
  prices: PayPriceOption[];
  selectedPriceId: string | null;
  onPriceSelect: (priceId: string) => void;
  currencyCode: string;
  formatCurrency: (amount: number, currencyCode: string) => string;
  formatBillingIntervalLabel: (interval: string | null | undefined) => string;
  embedded?: boolean;
}

export function PriceSelector({
  t,
  prices,
  selectedPriceId,
  onPriceSelect,
  currencyCode,
  formatCurrency,
  formatBillingIntervalLabel,
  embedded = false,
}: PriceSelectorProps) {
  const activePrices = prices.filter((p) => p.is_active !== false);
  if (activePrices.length <= 1) {
    return null;
  }

  const defaultPrice = activePrices.find((p) => p.is_default);
  const monthlyPrice = activePrices.find(
    (p) => p.billing_interval === "month" || p.billing_interval === "monthly",
  );

  const calculateSavings = (price: PayPriceOption) => {
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
      price.billing_interval === "year" || price.billing_interval === "yearly";
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
    <div className={cn("w-full space-y-2", !embedded && "mb-4")}>
      <Label className="text-sm font-normal text-gray-400">
        {t("checkout.billing_cycle.choose_plan")}
      </Label>

      <div className="space-y-1.5">
        {activePrices.map((price) => {
          const isSelected = price.price_id === selectedPriceId;
          const savings = calculateSavings(price);

          return (
            <button
              key={price.price_id}
              type="button"
              data-selected={isSelected ? "true" : "false"}
              onClick={() => onPriceSelect(price.price_id)}
              className={cn(
                "price-selector-option w-full flex items-center gap-2.5 px-3 h-10 rounded-md transition-colors duration-150",
                "bg-transparent text-left",
                isSelected && "price-selector-option-selected",
              )}
            >
              <div
                className={cn(
                  "h-3.5 w-3.5 shrink-0 rounded-full border flex items-center justify-center",
                  isSelected ? "border-[#56A5F9]" : "border-gray-600",
                )}
              >
                {isSelected && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#56A5F9]" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span className="font-medium text-gray-200">
                  {formatCurrency(price.amount, currencyCode)}
                </span>
                <span className="text-gray-400">
                  / {formatBillingIntervalLabel(price.billing_interval)}
                </span>
                {savings && (
                  <span className="ml-auto shrink-0 text-xs text-green-400">
                    {t("checkout.billing_cycle.save")} {savings.percent}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
