'use client';

import * as React from 'react';
import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { CheckoutSubmitButton } from '@/components/lomi-ui/checkout-submit-button';

export function CheckoutSubmitButtonDemo() {
  const [status, setStatus] = React.useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');

  return (
    <>
      <LomiUiPreview variant="checkout" innerClassName="max-w-md">
        <CheckoutSubmitButton
          paymentStatus={status}
          onClick={() => {
            setStatus('processing');
            window.setTimeout(() => setStatus('success'), 900);
            window.setTimeout(() => setStatus('idle'), 2200);
          }}
        />
      </LomiUiPreview>
      <p className="not-prose -mt-4 mb-6 text-sm text-fd-muted-foreground">
        Click to preview processing → success states.
      </p>
    </>
  );
}
