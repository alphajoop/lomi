import * as React from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Mirrors apps/checkout/src/components/ui/card.tsx (Card only). */
export const CheckoutCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border bg-card rounded-sm', className)}
    {...props}
  />
));
CheckoutCard.displayName = 'CheckoutCard';
