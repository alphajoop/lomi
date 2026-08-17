/** Stable seed for user profile placeholders. */
export function buildUserPlaceholderSeed(
  userId?: string | null,
  name?: string | null,
  email?: string | null,
): string {
  const id = userId?.trim();
  const normalizedName = name?.trim().toLowerCase();
  const emailPrefix = email?.split("@")[0]?.trim().toLowerCase();

  if (id && normalizedName) {
    return `user:${id}:${normalizedName}`;
  }

  if (id && emailPrefix) {
    return `user:${id}:${emailPrefix}`;
  }

  if (id) {
    return `user:${id}`;
  }

  if (normalizedName) {
    return `user:${normalizedName}`;
  }

  if (emailPrefix) {
    return `user:${emailPrefix}`;
  }

  return "user:unknown";
}
