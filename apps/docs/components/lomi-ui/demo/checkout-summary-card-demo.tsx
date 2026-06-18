import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { CheckoutSummaryCard } from '@/components/lomi-ui/checkout-summary-card';

export function CheckoutSummaryCardDemo() {
  return (
    <LomiUiPreview variant="panel">
      <CheckoutSummaryCard
        title="Pay for Design workshop"
        currency="XOF"
        description="A full-day workshop covering product design fundamentals."
        subtotal={12500}
        fees={[{ name: 'Processing fee', amount: 250 }]}
        discount={1000}
        total={11750}
      />
    </LomiUiPreview>
  );
}
