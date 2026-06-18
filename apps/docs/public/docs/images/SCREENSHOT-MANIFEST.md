# Docs screenshots — manual capture guide

You need **28 files** (12 screens × light + dark). Drop them in this folder; docs pages pick them up automatically — **no MDX edits** if filenames match.

```
apps/docs/public/docs/images/
├── start/     ← 3 screens (6 files)
└── build/     ← 9 screens (18 files)
```

---

## Before you start (same for every shot)

1. **Browser window:** 1280 × 720 px (16:9).
2. **Export:** WebP, quality ~85, **exactly 1280×720**.
3. **Two versions per screen:** same crop, only theme changes.
   - `*-light.webp` → light mode
   - `*-dark.webp` → dark mode
4. **Framing:** keep the important UI **centered** — docs crop edges on small screens.
5. **Secrets:** never ship real `lomi_sk_live_…` keys; blur or use test keys only.

**Theme toggle**

| App                 | Where to switch theme                              |
| ------------------- | -------------------------------------------------- |
| Dashboard           | Portal theme toggle                                |
| Checkout            | Checkout theme (if available) or system appearance |
| Customer portal     | Portal theme                                       |
| Docs (lomi-ui only) | Docs site theme toggle (top bar)                   |

---

## Your checklist

Copy this list and tick as you go:

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

## 1. Create account

|                 |                                                                                        |
| --------------- | -------------------------------------------------------------------------------------- |
| **Save as**     | `start/create-account-light.webp` and `start/create-account-dark.webp`                 |
| **Open**        | https://dashboard.lomi.africa/onboarding                                               |
| **Show**        | The step with the **business profile form** (name, country, use case / business type). |
| **Do not show** | Empty welcome splash with no form fields.                                              |
| **Chrome**      | Full window — onboarding usually has **no sidebar**.                                   |

---

## 2. API keys

|                 |                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Save as**     | `start/api-keys-light.webp` and `start/api-keys-dark.webp`                                                                |
| **Open**        | `https://dashboard.lomi.africa/{your-org-id}/settings/access-tokens`                                                      |
| **Show**        | **Access tokens** page — **Test** and **Live** sections both visible with `lomi_sk_test_…` / `lomi_pk_test_…` style keys. |
| **Do not show** | Live secret keys unmasked (blur if needed).                                                                               |
| **Chrome**      | Sidebar + top bar OK; crop to main panel.                                                                                 |

---

## 3. Hosted checkout (first payment)

|                 |                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Save as**     | `start/hosted-checkout-light.webp` and `start/hosted-checkout-dark.webp`                                                                   |
| **Open**        | A **sandbox** checkout URL from `checkout_url` after creating a session ([sandbox guide](https://docs.lomi.africa/start/sandbox-payments)) |
| **Show**        | Default **pay** step — org logo, product/amount, **Pay** button. Checkout card centered in the 16:9 frame.                                 |
| **Do not show** | Success page, cancel page, or error state.                                                                                                 |

**Get a URL:** `lomi checkout create` or `POST https://sandbox.api.lomi.africa/checkout-sessions` with your test key → open the `checkout_url`.

---

## 4. Choose integration (provider picker)

|                 |                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Save as**     | `build/choose-integration-light.webp` and `build/choose-integration-dark.webp`                                              |
| **Open**        | Same sandbox checkout session as above                                                                                      |
| **Show**        | Step where the customer **picks a payment method** — **Wave, MTN, SPI, Card** (or your enabled subset) as selectable tiles. |
| **Do not show** | Card number / expiry / CVC fields — that is shot #7, not this one.                                                          |
| **Framing**     | Crop tighter on the **provider picker** if needed.                                                                          |

---

## 5. Payment links

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| **Save as**     | `build/payment-links-light.webp` and `build/payment-links-dark.webp`                  |
| **Open**        | `https://dashboard.lomi.africa/{your-org-id}/payment-links`                           |
| **Show**        | Table with **at least one row** (name, amount, status e.g. active). **Test mode** ON. |
| **Do not show** | Empty “no payment links” state.                                                       |
| **Chrome**      | Sidebar OK; table fills the main area.                                                |

---

## 6. Mobile money

|                 |                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Save as**     | `build/mobile-money-light.webp` and `build/mobile-money-dark.webp`                                              |
| **Open**        | Sandbox checkout — after selecting **Wave** or **MTN**                                                          |
| **Show**        | Phone number field, USSD/push instructions, or other MoMo-specific copy. Must read clearly as **mobile money**. |
| **Do not show** | Generic checkout with no MoMo UI, or card form.                                                                 |

---

## 7. Cards

|                 |                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Save as**     | `build/cards-light.webp` and `build/cards-dark.webp`                                                  |
| **Open**        | Sandbox checkout — after selecting **Card**                                                           |
| **Show**        | Card **number**, **expiry**, and **CVC** fields. Optional: `4242 4242 4242 4242` in the number field. |
| **Do not show** | Provider picker only (that is shot #4).                                                               |

---

## 8. Balance

|             |                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------- |
| **Save as** | `build/balance-light.webp` and `build/balance-dark.webp`                                            |
| **Open**    | `https://dashboard.lomi.africa/{your-org-id}/balance`                                               |
| **Show**    | **Test mode** ON — test balance amount visible + at least one **completed** credit line in history. |
| **Chrome**  | Balance hero + first rows of history.                                                               |

---

## 9. Payouts / withdrawals

|                 |                                                                            |
| --------------- | -------------------------------------------------------------------------- |
| **Save as**     | `build/payouts-light.webp` and `build/payouts-dark.webp`                   |
| **Open**        | `https://dashboard.lomi.africa/{your-org-id}/settings/withdrawals`         |
| **Show**        | Payout methods list **or** “add withdrawal method” UI (bank / Wave / SPI). |
| **Do not show** | Empty error state.                                                         |

---

## 10. Subscriptions

|             |                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| **Save as** | `build/subscriptions-light.webp` and `build/subscriptions-dark.webp`                                      |
| **Open**    | `https://dashboard.lomi.africa/{your-org-id}/customers/subscriptions/{subscription-id}`                   |
| **Show**    | One subscription detail: plan name, **status** (active/trialing), customer, billing period / next charge. |
| **Chrome**  | Detail panel centered in frame.                                                                           |

---

## 11. Customer portal

|             |                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------ |
| **Save as** | `build/customer-portal-light.webp` and `build/customer-portal-dark.webp`                   |
| **Open**    | https://customers.lomi.africa — **after** launch-session login (not the OTP/email gate)    |
| **Show**    | **Payments** or **Subscriptions** tab with **≥1 row** (invoice, payment, or subscription). |

---

## 12. lomi. UI (docs preview)

|             |                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Save as** | `build/lomi-ui-light.webp` and `build/lomi-ui-dark.webp`                                    |
| **Open**    | https://docs.lomi.africa/build/lomi-ui/quick-start#payment-provider-selector                |
| **Show**    | **“Preview”** heading + **Payment Provider Selector** demo (Wave, MTN, π-SPI, Card radios). |
| **Theme**   | Use the **docs** theme toggle — not checkout theme.                                         |
| **Framing** | Scroll so Preview block + heading fit the 16:9 crop.                                        |

---

## Which docs pages use each image?

| Files                      | MDX pages                                |
| -------------------------- | ---------------------------------------- |
| `start/create-account`     | `start/create-account` (EN + FR)         |
| `start/api-keys`           | `start/api-keys` (EN + FR)               |
| `start/hosted-checkout`    | `start/first-payment` (EN + FR)          |
| `build/choose-integration` | `build/choose-integration` (EN + FR)     |
| `build/payment-links`      | `build/payment-links` (EN + FR)          |
| `build/mobile-money`       | `build/mobile-money` (EN + FR)           |
| `build/cards`              | `build/cards` (EN + FR)                  |
| `build/balance`            | `build/balance-and-settlement` (EN + FR) |
| `build/payouts`            | `build/payouts` (EN + FR)                |
| `build/subscriptions`      | `build/subscriptions` (EN + FR)          |
| `build/customer-portal`    | `build/customer-portal` (EN + FR)        |
| `build/lomi-ui`            | `build/lomi-ui/index`                    |

Component in docs: `<DocsScreenshot name="start/create-account" alt="…" />` — `name` matches the path **without** `-light`/`-dark`.
