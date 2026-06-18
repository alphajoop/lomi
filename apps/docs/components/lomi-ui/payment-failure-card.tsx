'use client';

/* eslint-disable @next/next/no-img-element -- lomi. UI registry components are framework-portable copy-paste components. */

import * as React from 'react';
import { AlertCircle } from 'lucide-react';

export interface PaymentFailureCardProps {
  organizationName: string;
  organizationLogoUrl?: string | null;
  title?: string;
  description?: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function OrganizationAvatar({
  name,
  logoUrl,
  size = 48,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-sm object-cover"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-sm bg-muted text-sm font-medium text-muted-foreground"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function PaymentFailureCard({
  organizationName,
  organizationLogoUrl,
  title = 'Payment failed',
  description = "We couldn't process your payment. Please try again.",
  errorMessage,
  retryLabel = 'Try again',
  onRetry,
  className,
}: PaymentFailureCardProps) {
  return (
    <section
      className={cn(
        'w-full max-w-md rounded-sm border border-border bg-card p-6 text-center text-card-foreground',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-center gap-4">
        <OrganizationAvatar
          name={organizationName}
          logoUrl={organizationLogoUrl}
          size={48}
        />
        <div className="h-8 w-px bg-border" />
        <AlertCircle className="h-10 w-10 text-red-700 dark:text-red-300" />
      </div>

      <h1 className="mb-2 text-xl font-normal text-red-700 dark:text-red-300">
        {title}
      </h1>
      <p className="mb-6 text-xs text-muted-foreground">{description}</p>

      {errorMessage ? (
        <div className="mb-6 w-full rounded-sm bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-[#E94441] px-4 text-sm font-medium text-white transition-colors hover:bg-[#D32F2F] outline-none"
      >
        {retryLabel}
      </button>
    </section>
  );
}
