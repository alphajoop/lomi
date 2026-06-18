import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { SubscriptionManagementCard } from '@/components/lomi-ui/subscription-management-card';

export function SubscriptionManagementCardDemo() {
  return (
    <LomiUiPreview variant="theme">
      <SubscriptionManagementCard
        planName="Growth"
        status="active"
        amount={25000}
        currency="XOF"
        interval="month"
        nextBillingDate="June 28, 2026"
        paymentMethod="Wave ending 4821"
        features={['Payment links', 'Subscriptions', 'Webhooks']}
      />
    </LomiUiPreview>
  );
}
