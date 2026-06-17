# Docs screenshot manifest

Drop **28 WebP files** here (14 screens × light + dark). Same images are used for EN and FR pages.

**Folder:** `apps/docs/public/docs/images/`  
**Naming:** `{path}-{light|dark}.webp`  
**Recommended capture:** 1280px wide, WebP quality ~85, hide personal data, use **Test** mode in dashboard.

After adding files, docs pages update automatically — no MDX edit needed if filenames match this manifest.

---

## Checklist (28 files)

### Start (`start/`)

| # | Filename (light + dark) | What to screenshot | Where |
|---|-------------------------|-------------------|-------|
| 1 | `start/create-account-light.webp` + `start/create-account-dark.webp` | Onboarding funnel — business type / profile step with form visible | `dashboard.lomi.africa/onboarding` (or first onboarding step after sign-up) |
| 2 | `start/api-keys-light.webp` + `start/api-keys-dark.webp` | Access tokens page showing test + live secret/publishable keys (blur or use test keys only) | `/{orgId}/settings/access-tokens` |
| 3 | `start/hosted-checkout-light.webp` + `start/hosted-checkout-dark.webp` | Hosted checkout payment page — card form or pay button visible, test session | Open a sandbox `checkout_url` (e.g. after `lomi checkout create` or sandbox doc recipe) on `checkout.lomi.africa` |

### Build (`build/`)

| # | Filename (light + dark) | What to screenshot | Where |
|---|-------------------------|-------------------|-------|
| 4 | `build/choose-integration-light.webp` + `build/choose-integration-dark.webp` | Payment method selection on checkout (Wave, MTN, Orange, SPI, Card visible) | Sandbox hosted checkout — **provider picker** step |
| 5 | `build/payment-links-light.webp` + `build/payment-links-dark.webp` | Payment links list with at least one link row (name, amount, status) | `/{orgId}/payment-links` |
| 6 | `build/mobile-money-light.webp` + `build/mobile-money-dark.webp` | Checkout on **mobile money** step (Wave or MTN selected, phone/USSD instructions visible) | Sandbox checkout — select Wave or MTN MoMo |
| 7 | `build/cards-light.webp` + `build/cards-dark.webp` | Checkout **card** entry (card number field, test card `4242…` optional) | Sandbox checkout — Card selected |
| 8 | `build/balance-light.webp` + `build/balance-dark.webp` | Balance overview — test balance, recent credits, availability | `/{orgId}/balance` (Test mode on) |
| 9 | `build/payouts-light.webp` + `build/payouts-dark.webp` | Withdrawals / payout methods or payout creation UI | `/{orgId}/settings/withdrawals` |
| 10 | `build/subscriptions-light.webp` + `build/subscriptions-dark.webp` | Single subscription detail (plan, status, customer, billing period) | `/{orgId}/customers/subscriptions/{subscriptionId}` |
| 11 | `build/customer-portal-light.webp` + `build/customer-portal-dark.webp` | Customer portal home — payment history or subscriptions tab | `customers.lomi.africa` (launch session or staging) |
| 12 | `build/lomi-ui-light.webp` + `build/lomi-ui-dark.webp` | Lomi UI component preview on docs (e.g. payment provider selector) | `docs.lomi.africa/build/lomi-ui/components/payment-provider-selector` — toggle docs **light/dark** theme |

---

## Capture tips

1. **Light:** dashboard/docs in light theme; save as `*-light.webp`.
2. **Dark:** same screen, same viewport, dark theme; save as `*-dark.webp`.
3. **Dashboard:** toggle Test/Live in portal — use **Test** for all dashboard shots except payouts doc (withdrawals UI can be test).
4. **Crop:** main content; optional thin window chrome is fine.
5. **Secrets:** never screenshot live `lomi_sk_live_` keys; blur or use test keys only.

---

## Pages wired to each asset

| Asset prefix | MDX files |
|--------------|-----------|
| `start/create-account` | `content/docs/start/create-account.mdx`, `.fr.mdx` |
| `start/api-keys` | `content/docs/start/api-keys.mdx`, `.fr.mdx` |
| `start/hosted-checkout` | `content/docs/start/first-payment.mdx`, `.fr.mdx` |
| `build/choose-integration` | `content/docs/build/choose-integration.mdx`, `.fr.mdx` |
| `build/payment-links` | `content/docs/build/payment-links.mdx`, `.fr.mdx` |
| `build/mobile-money` | `content/docs/build/mobile-money.mdx`, `.fr.mdx` |
| `build/cards` | `content/docs/build/cards.mdx`, `.fr.mdx` |
| `build/balance` | `content/docs/build/balance-and-settlement.mdx`, `.fr.mdx` |
| `build/payouts` | `content/docs/build/payouts.mdx`, `.fr.mdx` |
| `build/subscriptions` | `content/docs/build/subscriptions.mdx`, `.fr.mdx` |
| `build/customer-portal` | `content/docs/build/customer-portal.mdx`, `.fr.mdx` |
| `build/lomi-ui` | `content/docs/build/lomi-ui/index.mdx` |

---

## Full file list (copy-paste)

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
