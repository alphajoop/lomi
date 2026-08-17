'use client';

import * as React from 'react';
import { Phone } from 'lucide-react';
import type { FlagProps } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

export function CheckoutPhoneFlag({
  country,
  countryName,
  fallback,
}: FlagProps & { fallback?: React.ReactNode }) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const Flag = flags[country];

  return (
    <span
      className="checkout-phone-flag inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-[3px]"
      suppressHydrationWarning
    >
      {mounted && Flag ? (
        <Flag title={countryName} />
      ) : (
        (fallback ?? <Phone size={16} aria-hidden="true" role="presentation" />)
      )}
    </span>
  );
}
