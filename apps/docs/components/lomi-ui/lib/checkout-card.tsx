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
    className={cn(
      'rounded-[9px] border border-stone-200 bg-white text-stone-700 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(28,25,23,0.08)] dark:border-white/[0.16] dark:bg-[#252522] dark:text-stone-200',
      className,
    )}
    {...props}
  />
));
CheckoutCard.displayName = 'CheckoutCard';
