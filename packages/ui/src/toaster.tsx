import { Toaster as SileoToaster } from "sileo";

export type SileoThemeMode = "light" | "dark";

export type SileoToasterStylePreset = "dashboard" | "hosted";

type ToasterProps = {
  theme?: SileoThemeMode;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  offset?: number;
  /** dashboard uses foreground/muted-foreground; hosted checkout/storefront use text/text-muted */
  stylePreset?: SileoToasterStylePreset;
};

function getDefaultOptions(
  theme: SileoThemeMode,
  stylePreset: SileoToasterStylePreset,
) {
  const isDark = theme === "dark";
  const titleClass =
    stylePreset === "dashboard"
      ? "text-foreground! normal-case!"
      : isDark
        ? "text-white! normal-case!"
        : "text-zinc-900! normal-case!";
  const descriptionClass =
    stylePreset === "dashboard"
      ? "text-muted-foreground!"
      : isDark
        ? "text-white/70!"
        : "text-zinc-600!";
  const buttonClass = isDark
    ? stylePreset === "dashboard"
      ? "bg-white/10! hover:bg-white/15! text-foreground!"
      : "bg-white/10! hover:bg-white/15! text-text!"
    : stylePreset === "dashboard"
      ? "bg-black/5! hover:bg-black/10! text-foreground!"
      : "bg-black/5! hover:bg-black/10! text-text!";

  return {
    fill: isDark ? "#383838" : "#E5E7EB",
    roundness: 4,
    duration: 3000,
    styles: {
      title: titleClass,
      description: descriptionClass,
      badge: isDark ? "bg-white/10!" : "bg-black/5!",
      button: buttonClass,
    },
  };
}

export function Toaster({
  theme = "light",
  position = "top-right",
  offset = 20,
  stylePreset = "dashboard",
}: ToasterProps) {
  return (
    <SileoToaster
      theme={theme}
      position={position}
      offset={offset}
      options={getDefaultOptions(theme, stylePreset)}
    />
  );
}
