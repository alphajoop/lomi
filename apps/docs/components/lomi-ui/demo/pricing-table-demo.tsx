import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { PricingTable } from '@/components/lomi-ui/pricing-table';

export function PricingTableDemo() {
  return (
    <LomiUiPreview variant="theme">
      <PricingTable
        plans={[
          {
            id: 'starter',
            name: 'Starter',
            description: 'For early-stage teams.',
            monthlyPrice: 10000,
            yearlyPrice: 100000,
            currency: 'XOF',
            features: ['Payment links', 'Hosted checkout'],
          },
          {
            id: 'growth',
            name: 'Growth',
            description: 'For teams scaling payment operations.',
            monthlyPrice: 25000,
            yearlyPrice: 250000,
            currency: 'XOF',
            highlighted: true,
            features: ['Mobile money + cards', 'Subscriptions', 'Webhooks'],
          },
        ]}
      />
    </LomiUiPreview>
  );
}
