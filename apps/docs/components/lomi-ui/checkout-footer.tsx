/* eslint-disable @next/next/no-img-element -- Lomi UI registry components are framework-portable copy-paste components. */

import * as React from 'react';

export interface CheckoutFooterProps {
  termsHref?: string;
  privacyHref?: string;
  logoSrc?: string;
  logoAlt?: string;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function CheckoutFooter({
  termsHref = 'https://lomi.africa/terms?from=checkout',
  privacyHref = 'https://lomi.africa/privacy?from=checkout',
  logoSrc = '/company/lomi_l.webp',
  logoAlt = 'lomi.',
  className,
}: CheckoutFooterProps) {
  return (
    <div className={cn('select-none', className)}>
      <div className="flex flex-col items-center text-xs text-muted-foreground">
        <div className="mb-2 inline-flex items-center">
          <a
            href="https://lomi.africa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline font-semibold transition-opacity hover:opacity-80"
          >
            <img
              src={logoSrc}
              alt={logoAlt}
              width={28}
              height={28}
              className="h-[28px] w-auto"
            />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={termsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Terms
          </a>
          <span className="text-muted-foreground">|</span>
          <a
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
}
