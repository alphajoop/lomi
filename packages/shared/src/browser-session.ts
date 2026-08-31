export type BrowserSessionAudience = "admin" | "dashboard";

export type BrowserSessionTokens = {
  access_token: string;
  refresh_token?: string;
};

export function createBrowserSession(options: {
  audience: BrowserSessionAudience;
  getApiBaseUrl: () => string;
  getSessionTokens: () => Promise<BrowserSessionTokens | null>;
}) {
  let establishInFlight: Promise<boolean> | null = null;

  async function establishBrowserSession(): Promise<boolean> {
    if (establishInFlight) return establishInFlight;
    establishInFlight = (async () => {
      const tokens = await options.getSessionTokens();
      if (!tokens?.access_token) return false;
      try {
        const response = await fetch(
          `${options.getApiBaseUrl()}/auth/browser-session`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audience: options.audience,
              refresh_token: tokens.refresh_token,
            }),
          },
        );
        return response.ok;
      } catch {
        return false;
      }
    })().finally(() => {
      establishInFlight = null;
    });
    return establishInFlight;
  }

  async function revokeBrowserSession(): Promise<void> {
    try {
      await fetch(`${options.getApiBaseUrl()}/auth/browser-session/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      /* best-effort */
    }
  }

  return { establishBrowserSession, revokeBrowserSession };
}
