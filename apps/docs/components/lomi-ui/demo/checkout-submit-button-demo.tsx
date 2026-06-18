'use client';

import * as React from 'react';
import { CheckoutSubmitButton } from '@/components/lomi-ui/checkout-submit-button';

export function CheckoutSubmitButtonDemo() {
  const [status, setStatus] = React.useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');

  return (
    <div className="not-prose max-w-md rounded-sm border bg-white p-4">
      <CheckoutSubmitButton
        paymentStatus={status}
        onClick={() => {
          setStatus('processing');
          window.setTimeout(() => setStatus('success'), 900);
          window.setTimeout(() => setStatus('idle'), 2200);
        }}
      />
      <p className="mt-3 text-sm text-fd-muted-foreground">
        Click to preview processing → success states.
      </p>
    </div>
  );
}
