import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Theme-aware loading placeholder; contrast tuned via --skeleton in index.css */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-skeleton", className)}
      {...props}
    />
  );
}
