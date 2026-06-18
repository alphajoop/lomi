'use client';

import * as React from 'react';
import {
  PaymentProviderSelector,
  type ProviderId,
} from './payment-provider-selector';
import { CustomerInformationSection } from './customer-information-section';
import {
  CheckoutSubmitButton,
  type CheckoutPaymentStatus,
} from './checkout-submit-button';
import './lib/checkout-ui.css';

export interface MobileMoneyCheckoutCardProps {
  selectedProvider?: ProviderId;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  isDifferentWhatsApp?: boolean;
  onProviderChange?: (provider: ProviderId) => void;
  onFullNameChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onPhoneNumberChange?: (value?: string) => void;
  onWhatsAppNumberChange?: (value?: string) => void;
  onDifferentWhatsAppChange?: (value: boolean) => void;
  onSubmit?: () => void;
  paymentStatus?: CheckoutPaymentStatus;
  payButtonBgColor?: string;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function MobileMoneyCheckoutCard({
  selectedProvider,
  fullName = '',
  email = '',
  phoneNumber = '',
  whatsappNumber = '',
  isDifferentWhatsApp = false,
  onProviderChange,
  onFullNameChange,
  onEmailChange,
  onPhoneNumberChange,
  onWhatsAppNumberChange,
  onDifferentWhatsAppChange,
  onSubmit,
  paymentStatus = 'idle',
  payButtonBgColor = '#121317',
  className,
}: MobileMoneyCheckoutCardProps) {
  return (
    <div
      className={cn(
        'lomi-checkout-ui w-full max-w-md space-y-3 bg-white',
        className,
      )}
    >
      <PaymentProviderSelector
        providers={['WAVE', 'MTN', 'cards', 'spi']}
        selectedProvider={selectedProvider}
        onProviderChange={onProviderChange}
      />

      <CustomerInformationSection
        fullName={fullName}
        email={email}
        phoneNumber={phoneNumber}
        whatsappNumber={whatsappNumber}
        isDifferentWhatsApp={isDifferentWhatsApp}
        onFullNameChange={onFullNameChange}
        onEmailChange={onEmailChange}
        onPhoneNumberChange={onPhoneNumberChange}
        onWhatsAppNumberChange={onWhatsAppNumberChange}
        onDifferentWhatsAppChange={onDifferentWhatsAppChange}
      />

      <CheckoutSubmitButton
        payButtonBgColor={payButtonBgColor}
        paymentStatus={paymentStatus}
        onClick={onSubmit}
      />
    </div>
  );
}
