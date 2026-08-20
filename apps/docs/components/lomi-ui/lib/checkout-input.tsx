import * as React from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Interior-styled field — copied class names (no @lomi./ui import; registry must stay self-contained). */
export const CheckoutInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-[13px] text-stone-700 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(28,25,23,0.06)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-stone-400 hover:border-stone-300 focus:border-[#4568FF] focus-visible:shadow-[0_1px_2px_rgba(28,25,23,0.08),0_10px_20px_-14px_rgba(69,104,255,0.6)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.16] dark:bg-[#252522] dark:text-stone-200 dark:placeholder:text-stone-500 dark:hover:border-white/25 dark:focus:border-[#93B0FF]',
      className,
    )}
    {...props}
  />
));
CheckoutInput.displayName = 'CheckoutInput';

/** Stacked customer form text fields (name, email). */
export const checkoutCustomerFieldClass =
  'border border-stone-200 bg-white placeholder:text-stone-400 focus:border-[#4568FF] dark:border-white/[0.16] dark:bg-[#252522] dark:text-stone-200 dark:placeholder:text-stone-500';
