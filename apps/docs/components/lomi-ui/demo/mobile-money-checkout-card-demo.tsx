'use client';

import * as React from 'react';
import type { ProviderId } from '@/components/lomi-ui/payment-provider-selector';
import { MobileMoneyCheckoutCard } from '@/components/lomi-ui/mobile-money-checkout-card';

export function MobileMoneyCheckoutCardDemo() {
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
    <div className="not-prose lomi-checkout-ui flex justify-center bg-white p-4">
      <MobileMoneyCheckoutCard
        selectedProvider={provider}
        fullName={fullName}
        email={email}
        phoneNumber={phoneNumber}
        whatsappNumber={whatsappNumber}
        isDifferentWhatsApp={isDifferentWhatsApp}
        paymentStatus={paymentStatus}
        onProviderChange={setProvider}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPhoneNumberChange={(value) => setPhoneNumber(value ?? '')}
        onWhatsAppNumberChange={(value) => setWhatsAppNumber(value ?? '')}
        onDifferentWhatsAppChange={setIsDifferentWhatsApp}
        onSubmit={() => {
          setPaymentStatus('processing');
          window.setTimeout(() => setPaymentStatus('success'), 900);
          window.setTimeout(() => setPaymentStatus('idle'), 2200);
        }}
      />
    </div>
  );
}
