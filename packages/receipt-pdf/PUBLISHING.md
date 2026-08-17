# Publish @lomi./receipt-pdf to npm

Uses the same `@lomi.` npm organization as `@lomi./sdk`.

In the monorepo, checkout and dashboard consume this package from `packages/receipt-pdf` (`workspace:*` / `file:`). npm publish is for versioned artifacts outside the umbrella.

## One-time: log in

```bash
cd packages/receipt-pdf
npm login
```

## Publish

```bash
pnpm run build
pnpm publish --access public
```

Or:

```bash
pnpm run publish:npm
```

## CI

From the lomi. repo: **Actions → Publish SDKs → receipt-pdf**. Requires `NPM_TOKEN` with publish access to `@lomi.`.

## Version bumps

```bash
npm version patch   # 0.1.0 → 0.1.1
pnpm publish --access public
```
