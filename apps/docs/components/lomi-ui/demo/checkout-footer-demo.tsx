import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { CheckoutFooter } from '@/components/lomi-ui/checkout-footer';

export function CheckoutFooterDemo() {
  return (
    <LomiUiPreview variant="panel" innerClassName="p-6">
      <CheckoutFooter />
    </LomiUiPreview>
  );
}
