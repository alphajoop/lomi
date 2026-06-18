'use client';

import * as React from 'react';
import { CheckCircle } from 'lucide-react';

export interface PaymentStatusCardProps {
  organizationName: string;
  organizationLogoUrl?: string | null;
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: React.ReactNode;
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

export function PaymentStatusCard({
  organizationName,
  organizationLogoUrl,
  title = 'Payment successful',
  description = 'Thank you for your payment. Your transaction has been completed successfully.',
  primaryAction,
  className,
  children,
}: PaymentStatusCardProps) {
  const actionClass =
    'inline-flex h-10 w-full items-center justify-center rounded-sm bg-[#56A5F9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#52A1F8] outline-none';

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
        <CheckCircle className="h-10 w-10 text-green-700 dark:text-green-300" />
      </div>

      <h1 className="mb-2 text-xl font-normal text-green-700 dark:text-green-300">
        {title}
      </h1>
      <p className="mb-6 text-xs text-muted-foreground">{description}</p>

      {children ? (
        <div className="mb-6 space-y-3 text-left">{children}</div>
      ) : null}

      {primaryAction ? (
        primaryAction.href ? (
          <a href={primaryAction.href} className={actionClass}>
            {primaryAction.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className={actionClass}
          >
            {primaryAction.label}
          </button>
        )
      ) : null}
    </section>
  );
}
