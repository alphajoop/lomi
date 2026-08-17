/**
 * Formats a number into a compact representation with a maximum of 1 decimal place.
 * Examples: 1234 → 1.2K, 1234567 → 1.2M
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
