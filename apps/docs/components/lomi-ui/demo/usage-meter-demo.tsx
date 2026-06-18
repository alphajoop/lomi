import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { UsageMeter } from '@/components/lomi-ui/usage-meter';

export function UsageMeterDemo() {
  return (
    <LomiUiPreview variant="theme">
      <UsageMeter
        items={[
          { label: 'Checkout sessions', used: 820, limit: 1000 },
          { label: 'Payouts', used: 89, limit: 100 },
        ]}
      />
    </LomiUiPreview>
  );
}
