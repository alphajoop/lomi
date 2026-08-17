/**
 * lomi. Embedded Checkout SDK
 *
 * Script-tag loader, overlay mode, inline embeds, and checkout completion events.
 */

export {
  loadLomiCheckout,
  mountInlineProductEmbeds,
  interceptCheckoutLinks,
  observeDynamicEmbeds,
} from "./embed";

export type {
  LomiEmbedOptions,
  LomiEmbedResult,
  LomiCheckoutCompletePayload,
} from "./utils";

export type { LomiCheckoutEvent } from "./types";
export { buildCheckoutUrl, withEmbeddedParam, formatBytes } from "./utils";

import {
  interceptCheckoutLinks,
  loadLomiCheckout,
  mountInlineProductEmbeds,
  observeDynamicEmbeds,
} from "./embed";

declare global {
  interface Window {
    Lomi?: {
      loadLomiCheckout: typeof loadLomiCheckout;
      mountInlineProductEmbeds: typeof mountInlineProductEmbeds;
      interceptCheckoutLinks: typeof interceptCheckoutLinks;
      observeDynamicEmbeds: typeof observeDynamicEmbeds;
    };
  }
}

if (globalThis.window) {
  window.Lomi = {
    loadLomiCheckout,
    mountInlineProductEmbeds,
    interceptCheckoutLinks,
    observeDynamicEmbeds,
  };

  const boot = () => {
    mountInlineProductEmbeds();
    interceptCheckoutLinks();
    observeDynamicEmbeds();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}

export default {
  loadLomiCheckout,
  mountInlineProductEmbeds,
  interceptCheckoutLinks,
  observeDynamicEmbeds,
};
