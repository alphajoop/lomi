/**
 * Server entry for Next.js RSC / Route Handlers.
 * Import `@lomi./queries/server` from server modules only — never from client components.
 * Domain functions are isomorphic; only the injected client differs.
 */
import "server-only";

export * from "./index.js";
