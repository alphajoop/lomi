# Docs screenshot capture specification

Drop **28 WebP files** (12 screens × light + dark). Same images are used for EN and FR pages.

**Folder:** `apps/docs/public/docs/images/`  
**Subfolders:** `start/`, `build/`  
**Naming:** `{path}-{light|dark}.webp` (e.g. `start/create-account-light.webp`)

After adding files, docs pages update automatically — no MDX edit needed if filenames match this manifest.

---

## Global rules (every file)

| Rule             | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Export ratio** | **16:9**                                                       |
| **Export size**  | **1280 × 720 px** (or 1920 × 1080 for retina)                  |
| **Format**       | WebP, quality ~85                                              |
| **Light file**   | App/docs in **light** theme → `*-light.webp`                   |
| **Dark file**    | Same viewport & crop, **dark** theme → `*-dark.webp`           |
| **Composition**  | Put **subject UI in the center**; edges may be clipped in docs |

`DocsScreenshot` renders at 16:9 (`aspect-video`). Export at 16:9 so nothing important is cropped.

---

## Group A — Dashboard (wide app chrome)

**Profile:** Desktop **1280 × 720**. Include **sidebar + top bar** unless noted. **Test mode** ON. Never expose live `lomi_sk_live_` keys.

| #   | Files (light + dark)   | Ratio           | Viewport / crop             | Exact UI state                                                                                                     | URL                                                 |
| --- | ---------------------- | --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | `start/create-account` | 16:9 @ 1280×720 | Full window (no sidebar)    | Onboarding step with **business type / profile form** visible (name, country, use case). Not empty welcome splash. | `dashboard.lomi.africa/onboarding`                  |
| 2   | `start/api-keys`       | 16:9 @ 1280×720 | Main panel (sidebar OK)     | **Access tokens** — Test + Live sections with `lomi_sk_test_…` / `lomi_pk_test_…` (mask secrets if needed).        | `/{orgId}/settings/access-tokens`                   |
| 5   | `build/payment-links`  | 16:9 @ 1280×720 | Table fills main area       | Payment links list with **≥1 row** (name, amount, status). No empty state.                                         | `/{orgId}/payment-links`                            |
| 8   | `build/balance`        | 16:9 @ 1280×720 | Balance hero + history rows | **Test** balance amount + at least one **completed** credit line.                                                  | `/{orgId}/balance`                                  |
| 9   | `build/payouts`        | 16:9 @ 1280×720 | Withdrawals main panel      | Payout methods list or **add withdrawal method** (bank / Wave / SPI).                                              | `/{orgId}/settings/withdrawals`                     |
| 10  | `build/subscriptions`  | 16:9 @ 1280×720 | Detail panel centered       | One subscription: plan name, **status**, customer, billing period / next charge.                                   | `/{orgId}/customers/subscriptions/{subscriptionId}` |

---

## Group B — Hosted checkout (narrow ~490px UI)

Checkout is **~490px centered** on page. Use browser **1280×720** with checkout centered (neutral margins on sides), or mobile **390×844** letterboxed to 16:9.

**Session:** Sandbox checkout (`lomi checkout create` or [sandbox recipe](/start/sandbox-payments)) → open `checkout_url` on `checkout.lomi.africa`.

| #   | Files (light + dark)       | Ratio           | Viewport / crop          | Exact UI state                                                                    | Step             |
| --- | -------------------------- | --------------- | ------------------------ | --------------------------------------------------------------------------------- | ---------------- |
| 3   | `start/hosted-checkout`    | 16:9 @ 1280×720 | Checkout centered        | **Default pay step** — org logo, title/amount, **Pay** CTA. Not success/cancel.   | Initial checkout |
| 4   | `build/choose-integration` | 16:9 @ 1280×720 | Tight on provider picker | **Method selection** — Wave, MTN, Orange, SPI, Card tiles visible. Not card form. | Provider picker  |
| 6   | `build/mobile-money`       | 16:9 @ 1280×720 | MoMo step                | **Wave or MTN selected** — phone field, USSD/push copy visible.                   | After MoMo rail  |
| 7   | `build/cards`              | 16:9 @ 1280×720 | Card form                | **Card** selected — number, expiry, CVC fields. Optional `4242 4242 4242 4242`.   | After Card rail  |

---

## Group C — Customer portal

| #   | Files (light + dark)    | Ratio           | Viewport / crop | Exact UI state                                                                       | URL                     |
| --- | ----------------------- | --------------- | --------------- | ------------------------------------------------------------------------------------ | ----------------------- |
| 11  | `build/customer-portal` | 16:9 @ 1280×720 | Portal home     | Logged-in **Payments** or **Subscriptions** tab with **≥1 row**. Not OTP/email gate. | `customers.lomi.africa` |

---

## Group D — Docs site (Lomi UI)

| #   | Files (light + dark) | Ratio           | Viewport / crop         | Exact UI state                                                                            | URL                                                                   |
| --- | -------------------- | --------------- | ----------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 12  | `build/lomi-ui`      | 16:9 @ 1280×720 | Preview block + heading | **Payment Provider Selector** demo under “Preview”. Toggle **docs** theme (not checkout). | `docs.lomi.africa/build/lomi-ui/components/payment-provider-selector` |

---

## Quick reference

| Files                                   | Ratio           | One-line context              |
| --------------------------------------- | --------------- | ----------------------------- |
| `start/create-account-{light,dark}`     | 16:9 · 1280×720 | Onboarding form step          |
| `start/api-keys-{light,dark}`           | 16:9 · 1280×720 | Settings → access tokens      |
| `start/hosted-checkout-{light,dark}`    | 16:9 · 1280×720 | Sandbox checkout pay step     |
| `build/choose-integration-{light,dark}` | 16:9 · 1280×720 | Checkout provider picker      |
| `build/payment-links-{light,dark}`      | 16:9 · 1280×720 | Dashboard payment links table |
| `build/mobile-money-{light,dark}`       | 16:9 · 1280×720 | Checkout Wave/MTN step        |
| `build/cards-{light,dark}`              | 16:9 · 1280×720 | Checkout card entry form      |
| `build/balance-{light,dark}`            | 16:9 · 1280×720 | Dashboard test balance        |
| `build/payouts-{light,dark}`            | 16:9 · 1280×720 | Settings → withdrawals        |
| `build/subscriptions-{light,dark}`      | 16:9 · 1280×720 | Subscription detail           |
| `build/customer-portal-{light,dark}`    | 16:9 · 1280×720 | Portal payments/subscriptions |
| `build/lomi-ui-{light,dark}`            | 16:9 · 1280×720 | Docs component preview        |

**Total: 28 files**

---

## Capture checklist

- [ ] `start/create-account-light.webp` + `start/create-account-dark.webp`
- [ ] `start/api-keys-light.webp` + `start/api-keys-dark.webp`
- [ ] `start/hosted-checkout-light.webp` + `start/hosted-checkout-dark.webp`
- [ ] `build/choose-integration-light.webp` + `build/choose-integration-dark.webp`
- [ ] `build/payment-links-light.webp` + `build/payment-links-dark.webp`
- [ ] `build/mobile-money-light.webp` + `build/mobile-money-dark.webp`
- [ ] `build/cards-light.webp` + `build/cards-dark.webp`
- [ ] `build/balance-light.webp` + `build/balance-dark.webp`
- [ ] `build/payouts-light.webp` + `build/payouts-dark.webp`
- [ ] `build/subscriptions-light.webp` + `build/subscriptions-dark.webp`
- [ ] `build/customer-portal-light.webp` + `build/customer-portal-dark.webp`
- [ ] `build/lomi-ui-light.webp` + `build/lomi-ui-dark.webp`

---

## Pages wired to each asset

| Asset prefix               | MDX files                                                  |
| -------------------------- | ---------------------------------------------------------- |
| `start/create-account`     | `content/docs/start/create-account.mdx`, `.fr.mdx`         |
| `start/api-keys`           | `content/docs/start/api-keys.mdx`, `.fr.mdx`               |
| `start/hosted-checkout`    | `content/docs/start/first-payment.mdx`, `.fr.mdx`          |
| `build/choose-integration` | `content/docs/build/choose-integration.mdx`, `.fr.mdx`     |
| `build/payment-links`      | `content/docs/build/payment-links.mdx`, `.fr.mdx`          |
| `build/mobile-money`       | `content/docs/build/mobile-money.mdx`, `.fr.mdx`           |
| `build/cards`              | `content/docs/build/cards.mdx`, `.fr.mdx`                  |
| `build/balance`            | `content/docs/build/balance-and-settlement.mdx`, `.fr.mdx` |
| `build/payouts`            | `content/docs/build/payouts.mdx`, `.fr.mdx`                |
| `build/subscriptions`      | `content/docs/build/subscriptions.mdx`, `.fr.mdx`          |
| `build/customer-portal`    | `content/docs/build/customer-portal.mdx`, `.fr.mdx`        |
| `build/lomi-ui`            | `content/docs/build/lomi-ui/index.mdx`                     |

---

## Full file paths (copy-paste)

```
public/docs/images/start/create-account-light.webp
public/docs/images/start/create-account-dark.webp
public/docs/images/start/api-keys-light.webp
public/docs/images/start/api-keys-dark.webp
public/docs/images/start/hosted-checkout-light.webp
public/docs/images/start/hosted-checkout-dark.webp
public/docs/images/build/choose-integration-light.webp
public/docs/images/build/choose-integration-dark.webp
public/docs/images/build/payment-links-light.webp
public/docs/images/build/payment-links-dark.webp
public/docs/images/build/mobile-money-light.webp
public/docs/images/build/mobile-money-dark.webp
public/docs/images/build/cards-light.webp
public/docs/images/build/cards-dark.webp
public/docs/images/build/balance-light.webp
public/docs/images/build/balance-dark.webp
public/docs/images/build/payouts-light.webp
public/docs/images/build/payouts-dark.webp
public/docs/images/build/subscriptions-light.webp
public/docs/images/build/subscriptions-dark.webp
public/docs/images/build/customer-portal-light.webp
public/docs/images/build/customer-portal-dark.webp
public/docs/images/build/lomi-ui-light.webp
public/docs/images/build/lomi-ui-dark.webp
```
