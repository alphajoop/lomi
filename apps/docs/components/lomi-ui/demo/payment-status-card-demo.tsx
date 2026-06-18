import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { PaymentStatusCard } from '@/components/lomi-ui/payment-status-card';

export function PaymentStatusCardDemo() {
  return (
    <LomiUiPreview variant="panel">
      <PaymentStatusCard
        organizationName="Keur Studio"
        primaryAction={{ label: 'Continue', href: '#' }}
      />
    </LomiUiPreview>
  );
}
