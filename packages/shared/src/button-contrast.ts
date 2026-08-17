const DARK_FOREGROUND = "#121317";
const LIGHT_FOREGROUND = "#ffffff";

function parseHexColor(
  hex: string,
): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0]! + normalized[0]!, 16);
    const g = Number.parseInt(normalized[1]! + normalized[1]!, 16);
    const b = Number.parseInt(normalized[2]! + normalized[2]!, 16);
    return { r, g, b };
  }
  if (normalized.length === 6) {
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b };
  }
  return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

export function getPayButtonForeground(
  backgroundColor: string,
): typeof DARK_FOREGROUND | typeof LIGHT_FOREGROUND {
  const rgb = parseHexColor(backgroundColor);
  if (!rgb) return LIGHT_FOREGROUND;
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.55
    ? DARK_FOREGROUND
    : LIGHT_FOREGROUND;
}
