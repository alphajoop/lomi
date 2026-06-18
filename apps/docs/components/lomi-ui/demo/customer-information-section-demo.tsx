'use client';

import * as React from 'react';
import { LomiUiPreview } from '@/components/preview/lomi-ui-preview';
import { CustomerInformationSection } from '@/components/lomi-ui/customer-information-section';

export function CustomerInformationSectionDemo() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [whatsappNumber, setWhatsAppNumber] = React.useState('');
  const [isDifferentWhatsApp, setIsDifferentWhatsApp] = React.useState(false);

  return (
    <LomiUiPreview variant="checkout" innerClassName="max-w-md">
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
    </LomiUiPreview>
  );
}
