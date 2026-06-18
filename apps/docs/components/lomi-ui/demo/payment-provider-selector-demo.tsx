'use client';

import * as React from 'react';
import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import {
  PaymentProviderSelector,
  type ProviderId,
} from '@/components/lomi-ui/payment-provider-selector';

export function PaymentProviderSelectorDemo() {
  const [provider, setProvider] = React.useState<ProviderId>('WAVE');

  return (
    <>
      <LomiUiPreview variant="checkout">
        <PaymentProviderSelector
          selectedProvider={provider}
          onProviderChange={setProvider}
        />
      </LomiUiPreview>
      <p className="not-prose -mt-4 mb-6 text-sm text-fd-muted-foreground">
        Selected provider: <span className="font-medium">{provider}</span>
      </p>
    </>
  );
}
