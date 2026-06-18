'use client';

import * as React from 'react';
import type { ProviderId } from '@/components/lomi-ui/payment-provider-selector';
import { PaymentProviderSelector } from '@/components/lomi-ui/payment-provider-selector';
import { CustomerInformationSection } from '@/components/lomi-ui/customer-information-section';
import { CheckoutSubmitButton } from '@/components/lomi-ui/checkout-submit-button';

export function HostedCheckoutFormDemo() {
  const [provider, setProvider] = React.useState<ProviderId>('WAVE');
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [whatsappNumber, setWhatsAppNumber] = React.useState('');
  const [isDifferentWhatsApp, setIsDifferentWhatsApp] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');

  return (
    <div className="not-prose max-w-md space-y-3 rounded-sm border bg-white p-4">
      <PaymentProviderSelector
        selectedProvider={provider}
        onProviderChange={setProvider}
      />
      <CustomerInformationSection
        fullName={fullName}
        email={email}
        phoneNumber={phoneNumber}
        whatsappNumber={whatsappNumber}
        isDifferentWhatsApp={isDifferentWhatsApp}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPhoneNumberChange={(value) => setPhoneNumber(value ?? '')}
        onWhatsAppNumberChange={(value) => setWhatsAppNumber(value ?? '')}
        onDifferentWhatsAppChange={setIsDifferentWhatsApp}
      />
      <CheckoutSubmitButton
        paymentStatus={paymentStatus}
        onClick={() => {
          setPaymentStatus('processing');
          window.setTimeout(() => setPaymentStatus('success'), 900);
          window.setTimeout(() => setPaymentStatus('idle'), 2200);
        }}
      />
    </div>
  );
}
