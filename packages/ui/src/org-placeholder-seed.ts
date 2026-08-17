/** Stable seed for org logo placeholders — same org always gets the same avatar. */
export function buildOrgPlaceholderSeed(
  organizationId?: string | null,
  organizationName?: string | null,
): string {
  const id = organizationId?.trim();
  const name = organizationName?.trim().toLowerCase();

  if (id && name) {
    return `${id}:${name}`;
  }

  if (id) {
    return id;
  }

  if (name) {
    return `org:${name}`;
  }

  return "org:unknown";
}
