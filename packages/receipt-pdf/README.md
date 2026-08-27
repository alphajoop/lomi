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

Private workspace package. Dashboard and checkout consume it in-tree. Do not publish to npm.
