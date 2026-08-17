import type { ReceiptAddress } from "./types";

export function formatAddressLines(
  address: Pick<
    ReceiptAddress,
    "street" | "city" | "region" | "postalCode" | "country"
  >,
): string[] {
  const lines: string[] = [];

  if (address.street?.trim()) {
    lines.push(address.street.trim());
  }

  const cityLine = [address.city, address.region, address.postalCode]
    .filter((part) => part && part.trim().length > 0)
    .join(", ");

  if (cityLine) {
    lines.push(cityLine);
  }

  if (address.country?.trim()) {
    lines.push(address.country.trim());
  }

  return lines;
}

export function formatContactLines(
  address: Pick<ReceiptAddress, "email" | "phone">,
): string[] {
  const lines: string[] = [];
  if (address.email?.trim()) lines.push(address.email.trim());
  if (address.phone?.trim()) lines.push(address.phone.trim());
  return lines;
}
