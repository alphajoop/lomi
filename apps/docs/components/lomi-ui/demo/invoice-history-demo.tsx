'use client';

import { InvoiceHistory } from '@/components/lomi-ui/invoice-history';

export function InvoiceHistoryDemo() {
  return (
    <div className="not-prose rounded-sm border bg-fd-background p-4">
      <InvoiceHistory
        invoices={[
          {
            id: 'inv_001',
            date: 'May 28, 2026',
            description: 'Growth plan',
            amount: 25000,
            currency: 'XOF',
            status: 'paid',
          },
          {
            id: 'inv_002',
            date: 'Apr 28, 2026',
            description: 'Growth plan',
            amount: 25000,
            currency: 'XOF',
            status: 'refunded',
          },
        ]}
      />
    </div>
  );
}
