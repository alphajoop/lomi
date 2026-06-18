'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import * as RPNInput from 'react-phone-number-input';
import type { FlagProps } from 'react-phone-number-input';
import { CheckoutPhoneFlag } from './checkout-phone-flag';

const INPUT_BORDER = 'clamp(1px, 0.12vw, 1.3px) solid #d1d5db';

export type CheckoutCountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country }[];
  flagComponent?: React.ComponentType<FlagProps>;
};

/** Mirrors apps/checkout phone-number-input CountrySelect. */
export function CheckoutCountrySelect({
  disabled,
  value,
  onChange,
  options,
  flagComponent: FlagComponent = CheckoutPhoneFlag,
}: CheckoutCountrySelectProps) {
  return (
    <div
      className="relative inline-flex items-center self-stretch bg-transparent h-10 pe-2 ps-3 text-foreground transition-colors border-0 shadow-none rounded-l-sm"
      style={{ borderRight: INPUT_BORDER }}
    >
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className="text-muted-foreground/80">
          <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value || ''}
        onChange={(event) => onChange(event.target.value as RPNInput.Country)}
        className="absolute inset-0 text-sm opacity-0"
        aria-label="Select country"
        data-lpignore="true"
      >
        <option value="" className="text-gray-400">
          Select country
        </option>
        {options
          .filter((option) => option.value)
          .map((option) => (
            <option key={option.value || 'empty'} value={option.value}>
              {option.label}{' '}
              {option.value &&
                `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  );
}
