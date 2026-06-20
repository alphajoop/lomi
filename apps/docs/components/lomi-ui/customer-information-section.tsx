'use client';

import * as React from 'react';
import { ArrowRightLeft, Info } from 'lucide-react';
import type { Country } from 'react-phone-number-input';
import {
  CheckoutInput,
  checkoutCustomerFieldClass,
} from './lib/checkout-input';
import { CheckoutPhoneNumberInput } from './lib/checkout-phone-number-input';
import { CheckoutWhatsAppNumberInput } from './lib/checkout-whatsapp-number-input';
import './lib/checkout-ui.css';

const INPUT_BORDER = 'clamp(1px, 0.12vw, 1.3px) solid #d1d5db';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export interface CustomerInformationSectionProps {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  isDifferentWhatsApp?: boolean;
  defaultCountry?: Country;
  isPhoneValid?: boolean;
  onFullNameChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onPhoneNumberChange?: (value?: string) => void;
  onWhatsAppNumberChange?: (value?: string) => void;
  onDifferentWhatsAppChange?: (value: boolean) => void;
  onCountryChange?: (country: string) => void;
  onPhoneValidationChange?: (isValid: boolean | undefined) => void;
  title?: string;
  fullNamePlaceholder?: string;
  emailPlaceholder?: string;
  nameTooltip?: string;
  whatsappDifferentLabel?: string;
  switchToPhoneTitle?: string;
  phoneValidationError?: string;
  className?: string;
}

export function CustomerInformationSection({
  fullName = '',
  email = '',
  phoneNumber = '',
  whatsappNumber = '',
  isDifferentWhatsApp = false,
  defaultCountry = 'CI',
  isPhoneValid = true,
  onFullNameChange,
  onEmailChange,
  onPhoneNumberChange,
  onWhatsAppNumberChange,
  onDifferentWhatsAppChange,
  onCountryChange,
  onPhoneValidationChange,
  title = 'Personal information',
  fullNamePlaceholder = 'Full name',
  emailPlaceholder = 'Email address',
  nameTooltip = 'In case we need to contact you about your order.',
  whatsappDifferentLabel = 'My WhatsApp number is different',
  switchToPhoneTitle = 'Switch to using phone number',
  phoneValidationError = 'Please enter a valid phone number for the selected country.',
  className,
}: CustomerInformationSectionProps) {
  const [showNameTooltip, setShowNameTooltip] = React.useState(false);

  const handlePhoneNumberChange = (value: string | undefined) => {
    onPhoneNumberChange?.(value);
    if (!isDifferentWhatsApp) {
      onWhatsAppNumberChange?.(value);
    }
  };

  return (
    <div
      className={cn(
        'lomi-checkout-ui customer-information-section space-y-2.5 translate-y-1.5',
        className,
      )}
    >
      <label className="block select-none text-sm font-normal text-gray-700">
        {title}
      </label>
      <div className="customer-information-stack rounded-sm shadow-sm shadow-black/4">
        <div className="relative">
          <CheckoutInput
            type="text"
            name="fullName"
            value={fullName}
            onChange={(event) => onFullNameChange?.(event.target.value)}
            placeholder={fullNamePlaceholder}
            autoComplete="name"
            required
            className={cn(
              checkoutCustomerFieldClass,
              'input-checkout rounded-tl rounded-tr',
            )}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="relative hidden md:block">
              <button
                type="button"
                className="outline-none"
                aria-label="Name field information"
                onMouseEnter={() => setShowNameTooltip(true)}
                onMouseLeave={() => setShowNameTooltip(false)}
                onFocus={() => setShowNameTooltip(true)}
                onBlur={() => setShowNameTooltip(false)}
              >
                <Info className="h-3.5 w-3.5 cursor-pointer text-gray-400 transition-colors hover:text-gray-600" />
              </button>
              {showNameTooltip ? (
                <div className="absolute right-0 top-full z-10 mt-2 max-w-xs rounded-sm border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-sm">
                  {nameTooltip}
                </div>
              ) : null}
            </div>
            <span className="pointer-events-none text-red-500 md:hidden">
              *
            </span>
          </div>
        </div>

        <div className="-mt-px flex">
          <div className="relative w-full">
            <CheckoutInput
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => onEmailChange?.(event.target.value)}
              placeholder={emailPlaceholder}
              autoComplete="email"
              required
              className={cn(
                checkoutCustomerFieldClass,
                'rounded-none shadow-sm',
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
              *
            </span>
          </div>
        </div>

        <div className="-mt-px flex">
          <div className="box-border w-full rounded-none">
            <CheckoutPhoneNumberInput
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              onCountryChange={onCountryChange}
              onValidationChange={onPhoneValidationChange}
              defaultCountry={defaultCountry}
            />
          </div>
        </div>

        {!isDifferentWhatsApp ? (
          <div className="-mt-px flex">
            <div
              className="box-border w-full rounded-none bg-white"
              style={{ border: INPUT_BORDER }}
            >
              <div
                onMouseDown={() => onDifferentWhatsAppChange?.(true)}
                className="group flex h-10 cursor-pointer items-center justify-between px-3 transition-all duration-200"
              >
                <span className="text-xs text-gray-500">
                  {whatsappDifferentLabel}
                </span>
                <span className="flex items-center text-sm text-gray-600 transition-colors duration-200 group-hover:text-gray-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="-mt-px flex bg-transparent">
            <div className="relative w-full rounded-none bg-transparent">
              <CheckoutWhatsAppNumberInput
                value={whatsappNumber}
                onChange={(value) => onWhatsAppNumberChange?.(value)}
                defaultCountry={defaultCountry}
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-[1px] bg-blue-100 p-1.5 transition-colors hover:bg-blue-200"
                onMouseDown={() => onDifferentWhatsAppChange?.(false)}
                title={switchToPhoneTitle}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {isPhoneValid === false &&
        phoneNumber &&
        phoneNumber.trim().length >= 7 ? (
          <p className="mt-2 text-xs text-red-600">{phoneValidationError}</p>
        ) : null}
      </div>
    </div>
  );
}
