import { PaymentStatusCard } from '@/components/lomi-ui/payment-status-card';

export function PaymentStatusCardDemo() {
  return (
    <div className="not-prose flex justify-center rounded-sm border bg-background p-4 dark">
      <PaymentStatusCard
        organizationName="Keur Studio"
        primaryAction={{ label: 'Continue', href: '#' }}
      />
    </div>
  );
}
