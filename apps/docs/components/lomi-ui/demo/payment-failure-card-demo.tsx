'use client';

import { PaymentFailureCard } from '@/components/lomi-ui/payment-failure-card';

export function PaymentFailureCardDemo() {
  return (
    <div className="not-prose flex justify-center rounded-sm border bg-background p-4 dark">
      <PaymentFailureCard
        organizationName="Keur Studio"
        onRetry={() => undefined}
      />
    </div>
  );
}
