'use client';

import * as React from 'react';
import { PriceSelector } from '@/components/lomi-ui/price-selector';

export function PriceSelectorDemo() {
  const [selectedPriceId, setSelectedPriceId] = React.useState('monthly');

  return (
    <div
      className="not-prose max-w-md rounded-sm p-4"
      style={{ backgroundColor: '#121317' }}
    >
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
    </div>
  );
}
