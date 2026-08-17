export function resolveCustomerDisplayName(input: {
  rawName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}): string {
  return (
    input.rawName?.trim() ||
    `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim() ||
    input.email?.trim() ||
    input.phoneNumber?.trim() ||
    "Customer"
  );
}
