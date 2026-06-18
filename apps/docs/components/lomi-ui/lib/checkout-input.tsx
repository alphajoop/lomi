import * as React from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Mirrors apps/checkout/src/components/ui/input.tsx base field styles. */
export const CheckoutInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-r-sm bg-transparent px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-500',
      className,
    )}
    {...props}
  />
));
CheckoutInput.displayName = 'CheckoutInput';

/** Stacked customer form text fields (name, email). */
export const checkoutCustomerFieldClass =
  'border border-gray-300 bg-white placeholder:text-sm focus:bg-white dark:border-gray-300 dark:bg-white dark:text-gray-900 dark:focus:bg-white dark:placeholder:text-gray-500';
