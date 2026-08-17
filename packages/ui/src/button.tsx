import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import Spinner from "./spinner";
import { cn } from "./cn";
import { buttonVariants } from "./button-variants";

interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "Icon" | "iconPlacement"
  >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftSection?: React.ReactElement;
  rightSection?: React.ReactElement;
  Icon?: () => React.ReactElement | null;
  iconPlacement?: "left" | "right";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      disabled,
      loading = false,
      leftSection,
      rightSection,
      Icon,
      iconPlacement = "right",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={loading || disabled}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    const content: React.ReactNode[] = [];

    if (loading && !leftSection && !rightSection) {
      content.push(<Spinner key="loading-left" className="mr-2 h-3.5 w-3.5" />);
    } else if (loading && leftSection) {
      content.push(<Spinner key="loading-left" className="mr-2 h-3.5 w-3.5" />);
    } else if (!loading && leftSection) {
      content.push(
        <div key="left-section" className="mr-1">
          {leftSection}
        </div>,
      );
    } else if (!loading && Icon && iconPlacement === "left") {
      const iconElement = Icon();
      if (iconElement) {
        content.push(
          <div key="icon-left" className="mr-1">
            {iconElement}
          </div>,
        );
      }
    }

    if (children) {
      content.push(children);
    }

    if (!loading && rightSection) {
      content.push(
        <div key="right-section" className="ml-1">
          {rightSection}
        </div>,
      );
    } else if (!loading && Icon && iconPlacement === "right") {
      const iconElement = Icon();
      if (iconElement) {
        content.push(
          <div key="icon-right" className="ml-1">
            {iconElement}
          </div>,
        );
      }
    } else if (loading && rightSection) {
      content.push(
        <Spinner key="loading-right" className="ml-2 h-3.5 w-3.5" />,
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading || disabled}
        ref={ref}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
