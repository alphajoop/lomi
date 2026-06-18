'use client';

import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { PaymentFailureCard } from '@/components/lomi-ui/payment-failure-card';

export function PaymentFailureCardDemo() {
  return (
    <LomiUiPreview variant="panel">
      <PaymentFailureCard
        organizationName="Keur Studio"
        onRetry={() => undefined}
      />
    </LomiUiPreview>
  );
}
