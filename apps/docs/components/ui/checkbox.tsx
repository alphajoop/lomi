'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'onChange'
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => (
    <span className="relative inline-flex">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border border-border ring-offset-background transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-foreground/20 peer-checked:bg-muted peer-checked:text-foreground',
          className,
        )}
      >
        {checked ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
      </span>
    </span>
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
