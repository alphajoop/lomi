import * as React from "react";
import { cn } from "./cn";

// Minimal design tokens mapped to tailwind classes
type SpacingToken = "none" | "xs" | "s" | "m" | "l" | "xl" | "2xl" | "3xl";
type ColorToken =
  | "background-primary"
  | "background-secondary"
  | "background-card"
  | "text-primary"
  | "text-secondary"
  | "border-primary";
type BorderRadiusToken = "none" | "s" | "m" | "l" | "xl" | "full";

const spacingMap = {
  none: "p-0",
  xs: "p-1",
  s: "p-2",
  m: "p-3",
  l: "p-4",
  xl: "p-6",
  "2xl": "p-8",
  "3xl": "p-12",
} satisfies Record<SpacingToken, string>;

const bgMap = {
  "background-primary": "bg-white dark:bg-zinc-950",
  "background-secondary": "bg-zinc-50 dark:bg-zinc-900",
  "background-card": "bg-white dark:bg-zinc-900 shadow-sm border",
  "text-primary": "text-zinc-900 dark:text-zinc-50",
  "text-secondary": "text-zinc-500 dark:text-zinc-400",
  "border-primary": "border-zinc-200 dark:border-zinc-800",
} satisfies Record<ColorToken, string>;

const radiusMap = {
  none: "rounded-none",
  s: "rounded-sm",
  m: "rounded-md",
  l: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} satisfies Record<BorderRadiusToken, string>;

type BoxProps<E extends React.ElementType> = {
  as?: E;
  padding?: SpacingToken;
  backgroundColor?: ColorToken;
  color?: ColorToken;
  borderRadius?: BorderRadiusToken;
  display?: "block" | "flex" | "grid" | "inline-block" | "none";
  flexDirection?: "row" | "column";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "between" | "around";
  gap?: SpacingToken;
  className?: string; // Escape hatch
} & React.ComponentPropsWithoutRef<E>;

export const Box = React.forwardRef(
  <E extends React.ElementType = "div">(
    {
      as,
      padding,
      backgroundColor,
      color,
      borderRadius,
      display,
      flexDirection,
      alignItems,
      justifyContent,
      gap,
      className,
      ...rest
    }: BoxProps<E>,
    // Polymorphic ref target varies by `as`; `any` keeps forwardRef typing practical.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: React.ForwardedRef<any>,
  ) => {
    const Component = as || "div";

    const gapMap = {
      none: "gap-0",
      xs: "gap-1",
      s: "gap-2",
      m: "gap-3",
      l: "gap-4",
      xl: "gap-6",
      "2xl": "gap-8",
      "3xl": "gap-12",
    } satisfies Record<SpacingToken, string>;

    const classes = cn(
      padding && spacingMap[padding],
      backgroundColor && bgMap[backgroundColor],
      color && bgMap[color],
      borderRadius && radiusMap[borderRadius],
      display && `display-${display}`, // simplified mapping for demo
      display === "flex" && "flex",
      display === "grid" && "grid",
      flexDirection === "column" && "flex-col",
      flexDirection === "row" && "flex-row",
      alignItems === "center" && "items-center",
      justifyContent === "between" && "justify-between",
      justifyContent === "center" && "justify-center",
      gap && gapMap[gap],
      className,
    );

    return <Component ref={ref} className={classes} {...rest} />;
  },
);

Box.displayName = "Box";
