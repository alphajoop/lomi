'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type LomiUiPreviewVariant = 'checkout' | 'panel' | 'theme';

export interface LomiUiPreviewProps {
  children: React.ReactNode;
  variant?: LomiUiPreviewVariant;
  className?: string;
  innerClassName?: string;
}

const previewInnerBase = 'flex justify-center *:mx-auto';

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
          previewInnerBase,
          variant === 'checkout' &&
            'lomi-checkout-ui rounded-sm border border-fd-border/60 bg-white p-4',
          variant === 'panel' &&
            'rounded-sm border border-fd-border/40 bg-[#121317] p-4',
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
