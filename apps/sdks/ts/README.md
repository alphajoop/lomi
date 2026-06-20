# lomi. TypeScript SDK

Official JavaScript SDK for the lomi. REST API (`@lomi./sdk`). Works in Node 18+, Bun, and modern browsers **when you only embed publishable keys** (Payment Elements flows). Merchant secret keys belong on servers.

## Installation

```bash
pnpm add @lomi./sdk
# npm install @lomi./sdk / yarn add @lomi./sdk
```

## Quick start

```typescript
import { LomiSDK } from '@lomi./sdk';

const lomi = new LomiSDK({
  apiKey: process.env.LOMI_SECRET_KEY!,
  environment: 'test',
});

async function bootstrap() {
  const page = await lomi.customers.list({ page: 1, pageSize: 20 });
  console.log('- Customers page payload:', page);

  await lomi.payouts.create({
    destination: 'beneficiary',
    rail: 'wave',
    amount: 10000,
    currency: 'XOF',
    beneficiary: { name: 'Test User', phoneNumber: '+221771234567' },
  });

  console.log(await lomi.refunds.create({
    transactionId: '123e4567-e89b-12d3-a456-426614174000',
    amount: 1000,
    reason: 'duplicate_charge',
  }));
}

bootstrap().catch(console.error);
```

All methods map 1:1 to the curated public merchant OpenAPI routes (see docs `openapi.json` + `sdk-public-methods.json` inside `src/generated` after running codegen).

Docs: **[https://docs.lomi.africa](https://docs.lomi.africa)** • Type guide: **[`/build/sdks/typescript`](https://docs.lomi.africa/build/sdks/typescript)**

## Generation

Codegen lives under `apps/sdks/scripts/generate-types-sdk.js`. Run `node scripts/typescript-generate.js` from `apps/sdks` whenever `apps/docs/openapi.json` or `apps/docs/lib/scripts/manual-api/_expected-public-operations.json` changes.

## Contributing & support

- Monorepo `CONTRIBUTING.md`
- **[hello@lomi.africa](mailto:hello@lomi.africa)**

## License

MIT
