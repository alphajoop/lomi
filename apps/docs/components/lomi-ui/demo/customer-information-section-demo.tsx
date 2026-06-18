'use client';

import * as React from 'react';
import { CustomerInformationSection } from '@/components/lomi-ui/customer-information-section';

export function CustomerInformationSectionDemo() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [whatsappNumber, setWhatsAppNumber] = React.useState('');
  const [isDifferentWhatsApp, setIsDifferentWhatsApp] = React.useState(false);

  return (
    <div className="not-prose lomi-checkout-ui max-w-md bg-white p-4">
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
    </div>
  );
}
