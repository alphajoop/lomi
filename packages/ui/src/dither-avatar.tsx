import {
  generateDitherAvatarSvg,
  type DitherAvatarColors,
} from "./dither-avatar-lib";
import { shouldFillAvatarContainer } from "./avatar-container";
import { cn } from "./cn";

export interface DitherAvatarProps {
  seed: string;
  size?: number;
  gridCells?: number;
  colors?: Partial<DitherAvatarColors>;
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  title?: string;
  /** Fill a relative parent — use with absolute/inset-0 or inside a sized box */
  fill?: boolean;
}

const roundedClassName = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} satisfies Record<NonNullable<DitherAvatarProps["rounded"]>, string>;

export function DitherAvatar({
  seed,
  size = 40,
  gridCells = 40,
  colors,
  className = "",
  rounded = "sm",
  title,
  fill,
}: DitherAvatarProps) {
  const fillsContainer = shouldFillAvatarContainer(className, fill);
  const svgMarkup = generateDitherAvatarSvg({
    seed,
    size,
    gridCells,
    colors,
    fluid: fillsContainer,
  });
  const label = title ?? `Avatar for ${seed}`;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "block shrink-0 overflow-hidden",
        fillsContainer && "absolute inset-0 size-full min-h-0 min-w-0",
        roundedClassName[rounded],
        className,
      )}
      style={
        fillsContainer
          ? undefined
          : {
              width: size,
              height: size,
              maxWidth: size,
              maxHeight: size,
            }
      }
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
