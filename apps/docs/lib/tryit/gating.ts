/* @proprietary license */

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split('?')[0] ?? pathname;
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

/**
 * True for hand-authored REST operation pages (`/api/{resource}/{OperationId}`).
 * Folder indexes and conceptual API guides stay out of Try-it.
 */
export function isDocsApiOperationPath(pathname: string): boolean {
  const parts = normalizePathname(pathname).split('/').filter(Boolean);
  if (parts.length !== 3 || parts[0] !== 'api') return false;
  const operationId = parts[2];
  return operationId !== undefined && /[A-Z]/.test(operationId);
}

export function canAttachTestKey(ctx: {
  signedIn: boolean;
  organizations: readonly { id: string }[];
  selectedOrganizationId: string | null;
}): boolean {
  if (!ctx.signedIn) return false;
  if (ctx.organizations.length === 0) return false;
  if (ctx.organizations.length > 1 && !ctx.selectedOrganizationId) {
    return false;
  }
  return true;
}
