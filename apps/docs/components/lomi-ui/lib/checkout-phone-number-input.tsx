'use client';

import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { CheckoutInput } from './checkout-input';
import { CheckoutCountrySelect } from './checkout-country-select';
import { CheckoutPhoneFlag } from './checkout-phone-flag';

export interface CheckoutPhoneNumberInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onCountryChange?: (country: string) => void;
  onValidationChange?: (isValid: boolean | undefined) => void;
  defaultCountry?: RPNInput.Country;
}

export function CheckoutPhoneNumberInput({
  value,
  onChange,
  onCountryChange,
  onValidationChange,
  defaultCountry,
}: CheckoutPhoneNumberInputProps) {
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasTouchedRef = React.useRef(false);

  const markTouched = React.useCallback(() => {
    hasTouchedRef.current = true;
  }, []);

  const validatePhoneNumber = React.useCallback(
    (phoneValue: string) => {
      if (phoneValue && phoneValue.trim().length >= 7) {
        onValidationChange?.(isValidPhoneNumber(phoneValue));
      } else if (phoneValue && phoneValue.trim().length > 0) {
        onValidationChange?.(undefined);
      } else {
        onValidationChange?.(undefined);
      }
    },
    [onValidationChange],
  );

  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const hasMeaningfulValue = Boolean(value && value.trim().length >= 7);
      if (hasTouchedRef.current || hasMeaningfulValue) {
        validatePhoneNumber(value);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, validatePhoneNumber]);

  return (
    <div className="space-y-2">
      <div className="relative shadow-sm shadow-black/[.04]">
        <div className="flex w-full rounded-none bg-transparent checkout-phone-shell">
          <RPNInput.default
            className="flex w-full"
            international
            defaultCountry={defaultCountry}
            flagComponent={CheckoutPhoneFlag}
            countrySelectComponent={CheckoutCountrySelect}
            inputComponent={PhoneInput}
            placeholder="Phone number"
            value={value}
            onChange={(next) => {
              markTouched();
              onChange(next);
            }}
            onCountryChange={(countryCode) => {
              if (countryCode) {
                markTouched();
                onCountryChange?.(countryCode);
              }
            }}
            onBlur={() => {
              markTouched();
              validatePhoneNumber(value);
            }}
            countryCallingCodeEditable
          />
        </div>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
          *
        </span>
      </div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ ...props }, ref) => (
    <CheckoutInput
      className="rounded-none border-0 bg-transparent focus-visible:ring-0"
      ref={ref}
      {...props}
      autoComplete="tel"
      data-lpignore="true"
      data-form-type="other"
    />
  ),
);
PhoneInput.displayName = 'PhoneInput';
