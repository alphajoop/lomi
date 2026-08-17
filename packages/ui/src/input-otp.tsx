import * as React from "react";
import { OTPInput, type SlotProps } from "input-otp";
import { cn } from "./cn";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  SlotProps & React.ComponentPropsWithoutRef<"div">
>(
  (
    { char, hasFakeCaret, isActive, placeholderChar, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-10 w-10 rounded-sm text-center text-base",
          "border-2 border-border bg-background",
          "transition-all duration-200",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
          "flex items-center justify-center",
          isActive && "border-primary ring-1 ring-primary",
          className,
        )}
        {...props}
      >
        <span className="select-none">{char || placeholderChar}</span>
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-0.5 animate-caret-blink bg-primary duration-1000" />
          </div>
        )}
      </div>
    );
  },
);
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSlot };
