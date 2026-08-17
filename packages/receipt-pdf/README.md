# @lomi./receipt-pdf

Shared receipt layout (React) and PDF generation ([@react-pdf/renderer](https://react-pdf.org/)) for lomi. checkout and dashboard.

Source lives at `packages/receipt-pdf`. Dashboard uses `workspace:*`; checkout uses `file:../../packages/receipt-pdf`.

Peer dependency: `react` >= 18.

## Usage

```tsx
import {
  ReceiptLayout,
  buildReceiptDocumentData,
  downloadReceiptPdf,
  renderReceiptPdfBlob,
} from "@lomi./receipt-pdf";
```

## Development

```bash
pnpm install
pnpm run build
```

## Publish to npm

Same `@lomi.` scope as `@lomi./sdk`. From this directory:

```bash
npm login
pnpm run build
pnpm publish --access public
```

Or `pnpm run publish:npm`. Set `NPM_TOKEN` in CI secrets to run the GitHub Actions publish workflow.
