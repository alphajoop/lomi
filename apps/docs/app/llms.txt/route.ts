/* @proprietary license */

import { REST_API_SECTION_ORDER } from '@/lib/scripts/manual-api/constants';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import { source } from '@/lib/utils/source';

export const revalidate = false;

/** Slugs referenced in llms.txt output (validated by `pnpm docs:drift`). */
const LLMS_CURATED_SLUGS = [
  'start/integration-journey',
  'build/guides/verify-payments',
  'build/guides/payment-lifecycle',
  'build/guides/payment-methods',
  'api/payment-state-machine',
] as const;
void LLMS_CURATED_SLUGS;

function sectionTitleFromFolder(folder: string): string {
  return folder
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** First English MDX page under `api/{folder}/` (sorted by URL) for stable deep links. */
function firstApiPageInFolder(
  pages: ReturnType<typeof source.getPages>,
  folder: string,
) {
  return pages
    .filter((p) => p.slugs[0] === 'api' && p.slugs[1] === folder)
    .sort((a, b) => a.url.localeCompare(b.url))[0];
}

function pageBySlugPath(
  pages: ReturnType<typeof source.getPages>,
  path: string,
) {
  return pages.find((p) => p.slugs.join('/') === path);
}

export async function GET() {
  const docsOrigin = getDocsSiteOrigin();
  const pages = source.getPages('en');

  const lines: string[] = [];

  lines.push('# lomi.');
  lines.push('');
  lines.push(
    "> Francophone West Africa's payment platform: Mobile Money (Wave, MTN, SPI), cards (Visa, Mastercard, Apple Pay, Google Pay), bank transfers across eight UEMOA markets. Use this file as a **map**—then read the linked pages for schemas and examples.",
  );
  lines.push('');

  lines.push('## How to use this briefing');
  lines.push('');
  lines.push(
    '1. Read **Authentication** and **Integration quickstart** below.',
  );
  lines.push(
    '2. Pick one **Payment flow** that matches your product (hosted checkout, links, direct charge, subscriptions, or payouts).',
  );
  lines.push(
    `3. Use the [REST API hub](${docsOrigin}/api/index) for Try-it and samples; treat \`apps/docs/openapi.json\` in the monorepo as the machine-readable contract.`,
  );
  lines.push('');

  lines.push('## Integration quickstart');
  lines.push('');
  lines.push(
    '- **Amounts (XOF):** integer **centimes** (minor units) unless a field documents otherwise.',
  );
  lines.push(
    '- **Keys:** `lomi_sk_test_…` / `lomi_sk_live_…` — the **API key selects sandbox vs live**, not the hostname alone.',
  );
  lines.push(
    '- **Verify server-side before fulfill:** never trust client-only success; use webhooks + `GET /transactions/{id}`.',
  );
  lines.push('');
  lines.push(
    '1. Create a merchant account and API keys in the [dashboard](https://dashboard.lomi.africa).',
  );
  lines.push(
    '2. Build against **sandbox** first (`https://sandbox.api.lomi.africa`), then switch to **live** (`https://api.lomi.africa`) with live keys.',
  );
  lines.push(
    '3. **Default integration path:** hosted checkout sessions or payment links before direct `/charge/*` calls unless you need a custom server-initiated flow.',
  );
  lines.push(
    '4. **Environment is determined by the API key**, not the hostname alone—sandbox keys only work against sandbox; live keys only against live.',
  );
  lines.push(
    '5. **Mobile money (live) is asynchronous:** the customer approves on device; confirm final status via webhooks and `GET /transactions/{id}` before fulfilling.',
  );
  const integrationJourney = pageBySlugPath(pages, 'start/integration-journey');
  const paymentMethodsHub = pageBySlugPath(
    pages,
    'build/guides/payment-methods',
  );
  const verifyPayments = pageBySlugPath(pages, 'build/guides/verify-payments');
  const paymentLifecycle = pageBySlugPath(
    pages,
    'build/guides/payment-lifecycle',
  );
  const sandboxPayments = pageBySlugPath(pages, 'start/sandbox-payments');
  if (integrationJourney) {
    lines.push(
      `6. Follow the [integration journey](${docsOrigin}${integrationJourney.url}) for sandbox → webhooks → go-live.`,
    );
  }
  if (verifyPayments) {
    lines.push(
      `- [${verifyPayments.data.title ?? 'Verify payments'}](${docsOrigin}${verifyPayments.url}) — confirm status before fulfilling.`,
    );
  }
  if (paymentLifecycle) {
    lines.push(
      `- [${paymentLifecycle.data.title ?? 'Payment lifecycle'}](${docsOrigin}${paymentLifecycle.url}) — merchant-facing lifecycle hub.`,
    );
  }
  if (paymentMethodsHub) {
    lines.push(
      `- Supported countries and rails: [${paymentMethodsHub.data.title ?? 'Payment methods'}](${docsOrigin}${paymentMethodsHub.url}).`,
    );
  }
  if (sandboxPayments) {
    lines.push(
      `- Test cards and MoMo sandbox behavior: [${sandboxPayments.data.title ?? 'Sandbox payments'}](${docsOrigin}${sandboxPayments.url}).`,
    );
  }
  lines.push('');

  lines.push('## Authentication and environments');
  lines.push('');
  lines.push(
    'Send the merchant **API key** on every server-side call: header `X-API-KEY`. Sandbox and live keys are different; using the wrong key against an environment returns **401**. **The key determines sandbox vs live—not the request URL alone.**',
  );
  lines.push('');
  lines.push('- **Sandbox base URL**: `https://sandbox.api.lomi.africa`');
  lines.push('- **Live base URL**: `https://api.lomi.africa`');
  lines.push('');

  lines.push('## Idempotency, errors, and retries');
  lines.push('');
  lines.push(
    'Errors use the standard JSON shape with an HTTP status and a machine-readable message.',
  );
  lines.push(
    '**401** usually means a missing/invalid key; **404** means the resource does not exist for this API key; **429** means rate limiting.',
  );
  lines.push(
    'For **creates** that must not double-charge (payments, payouts), send an idempotency key when your client or gateway supports it.',
  );
  lines.push('');

  lines.push('## Payment flows (pick one)');
  lines.push('');
  lines.push(
    'Choose the path that matches your UX—not every merchant needs every API. **Prefer hosted checkout or payment links** unless you need direct charges.',
  );
  lines.push('');
  const hostedCheckout = pages.find(
    (p) => p.slugs[2] === 'CheckoutSessionsController_create',
  );
  if (hostedCheckout) {
    lines.push(
      `- **Hosted checkout** — buyer completes payment on the hosted experience: [Create checkout session](${docsOrigin}${hostedCheckout.url}).`,
    );
  }
  const plCreate = pages.find(
    (p) => p.slugs[2] === 'PaymentLinksController_create',
  );
  if (plCreate) {
    lines.push(
      `- **Shareable payment links** → [${plCreate.data.title ?? 'Create payment link'}](${docsOrigin}${plCreate.url}).`,
    );
  }
  const charge = pages.find(
    (p) => p.slugs[2] === 'ChargesController_createWaveCharge',
  );
  if (charge) {
    lines.push(
      `- **Direct mobile-money charge (server-initiated)** → [${charge.data.title ?? 'Charge'}](${docsOrigin}${charge.url}) when you are not using hosted checkout.`,
    );
  }
  const cardCharge = pages.find(
    (p) => p.slugs[2] === 'ChargesController_createCardCharge',
  );
  if (cardCharge) {
    lines.push(
      `- **Embedded card charge (Elements-style)** → [${cardCharge.data.title ?? 'Card charge'}](${docsOrigin}${cardCharge.url}).`,
    );
  }
  const pr = pages.find(
    (p) => p.slugs[2] === 'PaymentRequestsController_create',
  );
  if (pr) {
    lines.push(
      `- **Payment request (invoice-style)** → [${pr.data.title ?? 'Create payment request'}](${docsOrigin}${pr.url}).`,
    );
  }
  const subList = firstApiPageInFolder(pages, 'subscriptions');
  if (subList) {
    lines.push(
      `- **Subscriptions** → explore [${subList.data.title ?? 'Subscriptions'}](${docsOrigin}${subList.url}) (list, cancel, per-customer).`,
    );
  }
  const payouts = firstApiPageInFolder(pages, 'payouts');
  if (payouts) {
    lines.push(
      `- **Payouts (self wallet or third-party beneficiaries)** → [${payouts.data.title ?? 'Payouts'}](${docsOrigin}${payouts.url}).`,
    );
  }
  const wh = firstApiPageInFolder(pages, 'webhooks');
  if (wh) {
    lines.push(
      `- **Outbound webhooks (events to your server)** → [${wh.data.title ?? 'Webhooks'}](${docsOrigin}${wh.url}) and delivery logs under the same API section.`,
    );
  }
  lines.push('');

  lines.push('## REST API by domain');
  lines.push('');
  lines.push(
    `Each item links into the generated endpoint pages for that resource group. Primary hub: [REST API](${docsOrigin}/api/index).`,
  );
  lines.push('');
  for (const folder of REST_API_SECTION_ORDER) {
    const p = firstApiPageInFolder(pages, folder);
    if (!p) continue;
    const label = sectionTitleFromFolder(folder);
    lines.push(
      `- **${label}**: [${p.data.title ?? label}](${docsOrigin}${p.url})`,
    );
  }
  lines.push('');

  lines.push('## Guides to read next');
  lines.push('');
  const whatIs = pageBySlugPath(pages, 'start/overview');
  if (whatIs) {
    lines.push(
      `- [${whatIs.data.title ?? 'What is lomi.?'}](${docsOrigin}${whatIs.url})`,
    );
  }
  if (integrationJourney) {
    lines.push(
      `- [${integrationJourney.data.title ?? 'Integration journey'}](${docsOrigin}${integrationJourney.url})`,
    );
  }
  if (verifyPayments) {
    lines.push(
      `- [${verifyPayments.data.title ?? 'Verify payments'}](${docsOrigin}${verifyPayments.url})`,
    );
  }
  if (paymentLifecycle) {
    lines.push(
      `- [${paymentLifecycle.data.title ?? 'Payment lifecycle'}](${docsOrigin}${paymentLifecycle.url})`,
    );
  }
  if (paymentMethodsHub) {
    lines.push(
      `- [${paymentMethodsHub.data.title ?? 'Payment methods'}](${docsOrigin}${paymentMethodsHub.url})`,
    );
  }
  const psm = pageBySlugPath(pages, 'api/payment-state-machine');
  if (psm) {
    lines.push(
      `- [${psm.data.title ?? 'Payment state machine'}](${docsOrigin}${psm.url}) — status transitions and balances`,
    );
  } else {
    lines.push(
      `- [Payment state machine](${docsOrigin}/api/payment-state-machine) — status transitions and balances`,
    );
  }
  const mcp = pageBySlugPath(pages, 'reference/integrations/mcp');
  if (mcp) {
    lines.push(`- [${mcp.data.title ?? 'MCP'}](${docsOrigin}${mcp.url})`);
  }
  lines.push('');

  lines.push('## Document map (browse by section)');
  lines.push('');
  lines.push(
    'Prefer section sidebars on the docs site for exhaustive lists. High-level areas:',
  );
  lines.push('');
  const catOrder = ['core', 'reference', 'api', 'openapi'];
  const byCat = new Map<
    string,
    { title: string; url: string; description?: string }[]
  >();
  for (const page of pages) {
    const category = page.slugs[0] || 'general';
    const list = byCat.get(category) ?? [];
    list.push({
      title: page.data.title ?? 'lomi.',
      url: `${docsOrigin}${page.url}`,
      description: page.data.description,
    });
    byCat.set(category, list);
  }
  for (const cat of catOrder) {
    const list = byCat.get(cat);
    if (!list?.length) continue;
    const sample = list.slice(0, 4);
    lines.push(`### ${cat}`);
    for (const entry of sample) {
      lines.push(
        `- [${entry.title}](${entry.url})${entry.description ? ` — ${entry.description}` : ''}`,
      );
    }
    if (list.length > sample.length) {
      lines.push(
        `_…and ${list.length - sample.length} more pages in this section (see docs sidebar)._`,
      );
    }
    lines.push('');
  }
  for (const [category, list] of byCat) {
    if (catOrder.includes(category)) continue;
    const sample = list.slice(0, 3);
    lines.push(`### ${category}`);
    for (const entry of sample) {
      lines.push(
        `- [${entry.title}](${entry.url})${entry.description ? ` — ${entry.description}` : ''}`,
      );
    }
    if (list.length > sample.length) {
      lines.push(
        `_…and ${list.length - sample.length} more pages (see docs sidebar)._`,
      );
    }
    lines.push('');
  }

  lines.push('## Contact and support');
  lines.push('');
  lines.push('- Website: https://lomi.africa');
  lines.push(`- Documentation: ${docsOrigin}`);
  lines.push('- Email: hello@lomi.africa');
  lines.push('- GitHub: https://github.com/lomiafrica/lomi./');
  lines.push('- Discord: https://discord.gg/33syDfh9');
  lines.push('- X: https://twitter.com/lomiafrica');
  lines.push('');

  lines.push('## Common questions');
  lines.push('');
  lines.push(
    `**Where do schemas live?** Use the [REST API](${docsOrigin}/api/index) explorer and the OpenAPI export at \`apps/docs/openapi.json\` (generated from \`apps/api\`).`,
  );
  const txHub = firstApiPageInFolder(pages, 'transactions');
  if (txHub) {
    lines.push(
      `**How do I reconcile payments?** Start from [${txHub.data.title ?? 'Transactions'}](${docsOrigin}${txHub.url}) and tie provider references to your internal order IDs using metadata on creates.`,
    );
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
