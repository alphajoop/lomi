'use client';

import * as React from 'react';
import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { PriceSelector } from '@/components/lomi-ui/price-selector';

export function PriceSelectorDemo() {
  const [selectedPriceId, setSelectedPriceId] = React.useState('monthly');

  return (
    <LomiUiPreview variant="panel" innerClassName="mx-auto max-w-md">
      <PriceSelector
        selectedPriceId={selectedPriceId}
        onPriceSelect={setSelectedPriceId}
        currencyCode="XOF"
        prices={[
          {
            price_id: 'monthly',
            amount: 25000,
            billing_interval: 'monthly',
            is_default: true,
          },
          {
            price_id: 'yearly',
            amount: 250000,
            billing_interval: 'yearly',
          },
        ]}
      />
    </LomiUiPreview>
  );
}
