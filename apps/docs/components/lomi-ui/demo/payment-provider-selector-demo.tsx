'use client';

import * as React from 'react';
import {
  PaymentProviderSelector,
  type ProviderId,
} from '@/components/lomi-ui/payment-provider-selector';

export function PaymentProviderSelectorDemo() {
  const [provider, setProvider] = React.useState<ProviderId>('WAVE');

  return (
    <div className="not-prose lomi-checkout-ui bg-white p-4">
      <PaymentProviderSelector
        selectedProvider={provider}
        onProviderChange={setProvider}
      />
      <p className="mt-3 text-sm text-fd-muted-foreground">
        Selected provider: <span className="font-medium">{provider}</span>
      </p>
    </div>
  );
}
