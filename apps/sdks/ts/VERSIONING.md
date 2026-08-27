# @lomi./sdk version policy

This package follows [semver](https://semver.org/) (`MAJOR.MINOR.PATCH`). Increment **extremely slowly**. Prefer patch only:

```
1.6.0 → 1.6.1 → 1.6.2 → …
```

Do not bump minor or major unless asked. npm cannot publish a fourth number (`1.6.1.1` is invalid).

CI publishes when the version in `package.json` is new (`app-publish-npm.yml`, Trusted Publisher, no npm token). Leave the version alone unless you intend to publish. Then bump the last number and push `main`.

- **PATCH** (`1.6.0` → `1.6.1`): backward-compatible fixes, docs, typings, or small additive helpers. Use this for most routine SDK releases.
- **MINOR** (`1.6.x` → `1.7.0`): new optional APIs or behavior that remains backward-compatible for existing callers. Only when asked.
- **MAJOR** (`1.x` → `2.0.0`): breaking changes. Only when asked.

## Non-TypeScript SDKs (Python, Go, PHP)

Generators in `apps/sdks/scripts/` read the **same** merchant contract as the TypeScript SDK:

- `apps/docs/openapi.json`
- `apps/docs/lib/scripts/manual-api/_expected-public-operations.json`

Manifests (`sdk-public-methods.json`, `sdk_python_methods.json`, `sdk_go_methods.json`, `sdk_php_methods.json`) must list the **same** camelCase service keys and method names as TypeScript. Verify with `node scripts/verify-sdk-surface-parity.js` from [`apps/sdks/`](../) (see `verify:sdk-parity` in `apps/sdks/package.json`).

- **Python**: service attributes on `LomiClient` use `snake_case` (e.g. `checkout_sessions`); method names use `snake_case` (e.g. `create_wave_payout`). See `sdk_python_methods.json` for the mapping vs TypeScript.
- **Go / PHP**: exported struct fields / client properties follow **camelCase** parity with the TS manifest where applicable (e.g. `Charges`, `charges`).
- **Breaking changes** to the public allowlist or `METHOD_NAME_BY_OP` mappings are **major** for all published SDKs unless you provide explicit shims and a deprecation window.
