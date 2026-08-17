# Shared i18n automation

Canonical implementations:

- `sync-missing-translations.mjs` adds missing keys from `en.json` into fr/es/zh
- `analyze-i18n.mjs` checks completeness or removes unused keys

App wrappers under `apps/<app>/scripts/i18n/` only pass `--locales-dir`, `--src-dir`, and `--protect` prefixes. They walk up to this folder so they work from the umbrella checkout.

```bash
node tooling/scripts/i18n/sync-missing-translations.mjs --locales-dir src/lib/locales
node tooling/scripts/i18n/analyze-i18n.mjs check --locales-dir src/lib/locales --src-dir src
node tooling/scripts/i18n/analyze-i18n.mjs clean --protect onboarding.step1.org_industry.options.
```
