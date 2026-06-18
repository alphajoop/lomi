'use client';

import * as React from 'react';

type LomiUiPreviewVariant = 'checkout' | 'panel' | 'theme';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export interface LomiUiPreviewProps {
  children: React.ReactNode;
  variant?: LomiUiPreviewVariant;
  className?: string;
  innerClassName?: string;
}

export function LomiUiPreview({
  children,
  variant = 'theme',
  className,
  innerClassName,
}: LomiUiPreviewProps) {
  return (
    <div
      className={cn(
        'not-prose my-6 overflow-hidden rounded-sm border border-fd-border bg-fd-muted/40 p-4',
        className,
      )}
    >
      <div
        className={cn(
          variant === 'checkout' &&
            'lomi-checkout-ui rounded-sm border border-fd-border/60 bg-white p-4',
          variant === 'panel' &&
            'flex justify-center rounded-sm border border-fd-border/40 bg-[#121317] p-4',
          variant === 'theme' &&
            'rounded-sm border border-fd-border/60 bg-fd-background p-4',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
