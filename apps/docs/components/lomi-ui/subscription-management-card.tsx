'use client';

import * as React from 'react';
import { CalendarDays, CreditCard, PackageCheck } from 'lucide-react';

export interface SubscriptionManagementCardProps {
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  nextBillingDate: string;
  paymentMethod: string;
  features: string[];
  onUpdatePlan?: () => void;
  onCancel?: () => void;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SubscriptionManagementCard({
  planName,
  status,
  amount,
  currency,
  interval,
  nextBillingDate,
  paymentMethod,
  features,
  onUpdatePlan,
  onCancel,
  className,
}: SubscriptionManagementCardProps) {
  return (
    <section
      className={cn(
        'w-full max-w-2xl rounded-sm border bg-card p-5 text-card-foreground shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <PackageCheck className="h-5 w-5 text-primary" />
            Current subscription
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the customer plan and billing cadence.
          </p>
        </div>
        <span className="w-fit rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
          {status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-5 rounded-sm border border-border bg-muted/50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{planName} plan</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {formatMoney(amount, currency)}
              <span className="text-sm font-normal text-muted-foreground">
                /{interval}
              </span>
            </p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:text-right">
            <span className="inline-flex items-center gap-2 sm:justify-end">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Next bill: {nextBillingDate}
            </span>
            <span className="inline-flex items-center gap-2 sm:justify-end">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {paymentMethod}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground"
          >
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onUpdatePlan}
          className="inline-flex h-10 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Update plan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-sm border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Cancel subscription
        </button>
      </div>
    </section>
  );
}
