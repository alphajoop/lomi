export const PORT = Number(process.env.PORT ?? 3460);
export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ?? 'http://localhost:3460';
export const HANDLE_DOMAIN = process.env.HANDLE_DOMAIN ?? 'lomi.pay';
export const WALLETS_DB_PATH =
  process.env.WALLETS_DB_PATH ?? './data/wallets.sqlite';
export const OWNER_SESSION_TTL_HOURS = Number(
  process.env.OWNER_SESSION_TTL_HOURS ?? 168,
);

export function handleFqdn(handle: string): string {
  return `${handle}.${HANDLE_DOMAIN}`;
}

export function agentHandleFqdn(handle: string, agentSlug: string): string {
  return `${agentSlug}.${handle}.${HANDLE_DOMAIN}`;
}
