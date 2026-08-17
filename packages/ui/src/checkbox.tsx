import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "./cn";

/** Neutral checked state — matches settings / notification checkboxes. */
export const checkboxClassName =
  "peer h-[18px] w-[18px] shrink-0 rounded-[5px] border border-stone-300 transition-colors focus-visible:outline-none focus-visible:border-[#4568FF] focus-visible:shadow-[0_0_0_1px_#4568FF] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-stone-800 data-[state=checked]:border-stone-800 data-[state=checked]:text-white dark:border-white/[0.16] dark:focus-visible:border-[#93B0FF] dark:data-[state=checked]:bg-stone-200 dark:data-[state=checked]:text-stone-900";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxClassName, className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
