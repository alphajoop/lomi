import { CheckoutSummaryCard } from '@/components/lomi-ui/checkout-summary-card';

export function CheckoutSummaryCardDemo() {
  return (
    <div className="not-prose flex justify-center p-4">
      <CheckoutSummaryCard
        title="Pay for Design workshop"
        currency="XOF"
        description="A full-day workshop covering product design fundamentals."
        subtotal={12500}
        fees={[{ name: 'Processing fee', amount: 250 }]}
        discount={1000}
        total={11750}
      />
    </div>
  );
}
