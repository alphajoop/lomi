/* @proprietary license */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LomiUiRegistryFile {
  path: string;
  target: string;
  type: 'registry:component';
}

export interface LomiUiRegistryAsset {
  path: string;
  target: string;
  type: 'registry:file';
}

export interface LomiUiRegistryItem {
  name: string;
  title: string;
  description: string;
  files: LomiUiRegistryFile[];
  assetFiles?: LomiUiRegistryAsset[];
  dependencies?: string[];
  registryDependencies?: string[];
}

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(baseDir, '..', '..');

const paymentChannelAssets: LomiUiRegistryAsset[] = [
  'wave.webp',
  'mtn.webp',
  'orange.webp',
  'spi.webp',
  'pi_spi.webp',
  'cards.webp',
].map((file) => ({
  path: `public/payment_channels/${file}`,
  target: `public/payment_channels/${file}`,
  type: 'registry:file' as const,
}));

export const lomiUiRegistry: {
  dir: string;
  name: string;
  version: string;
  homepage: string;
  items: LomiUiRegistryItem[];
} = {
  dir: docsDir,
  name: 'lomi-ui',
  version: '1.0.0',
  homepage: 'https://docs.lomi.africa/build/lomi-ui',
  items: [
    {
      name: 'payment-provider-selector',
      title: 'Payment Provider Selector',
      description:
        'Select Wave, MTN, Orange Money, SPI, or card payment rails.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/payment-provider-selector.tsx',
          target: 'components/lomi-ui/payment-provider-selector.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/payment-provider-selector-demo.tsx',
          target: 'components/lomi-ui/demo/payment-provider-selector-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: paymentChannelAssets,
    },
    {
      name: 'mobile-money-checkout-card',
      title: 'Mobile Money Checkout Card',
      description:
        'A focused checkout card for Wave, MTN, Orange Money, and SPI.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/mobile-money-checkout-card.tsx',
          target: 'components/lomi-ui/mobile-money-checkout-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/payment-provider-selector.tsx',
          target: 'components/lomi-ui/payment-provider-selector.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/mobile-money-checkout-card-demo.tsx',
          target: 'components/lomi-ui/demo/mobile-money-checkout-card-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: paymentChannelAssets.filter((asset) =>
        [
          'wave.webp',
          'mtn.webp',
          'orange.webp',
          'spi.webp',
          'pi_spi.webp',
        ].some((file) => asset.path.endsWith(file)),
      ),
    },
    {
      name: 'checkout-summary-card',
      title: 'Checkout Summary Card',
      description: 'A dark checkout summary inspired by Lomi hosted checkout.',
      files: [
        {
          path: 'components/lomi-ui/checkout-summary-card.tsx',
          target: 'components/lomi-ui/checkout-summary-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/checkout-summary-card-demo.tsx',
          target: 'components/lomi-ui/demo/checkout-summary-card-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'payment-status-card',
      title: 'Payment Status Card',
      description: 'Show success, failed, and pending checkout outcomes.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/payment-status-card.tsx',
          target: 'components/lomi-ui/payment-status-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/payment-provider-selector.tsx',
          target: 'components/lomi-ui/payment-provider-selector.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/payment-status-card-demo.tsx',
          target: 'components/lomi-ui/demo/payment-status-card-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: paymentChannelAssets,
    },
    {
      name: 'pricing-table',
      title: 'Pricing Table',
      description:
        'A Lomi-styled plan selector for checkout, subscription, and pricing pages.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/pricing-table.tsx',
          target: 'components/lomi-ui/pricing-table.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/pricing-table-demo.tsx',
          target: 'components/lomi-ui/demo/pricing-table-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'invoice-history',
      title: 'Invoice History',
      description:
        'A compact invoice and receipt table for customer billing surfaces.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/invoice-history.tsx',
          target: 'components/lomi-ui/invoice-history.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/invoice-history-demo.tsx',
          target: 'components/lomi-ui/demo/invoice-history-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'subscription-management-card',
      title: 'Subscription Management Card',
      description: "Show and manage a customer's current subscription.",
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/subscription-management-card.tsx',
          target: 'components/lomi-ui/subscription-management-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/subscription-management-card-demo.tsx',
          target:
            'components/lomi-ui/demo/subscription-management-card-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'usage-meter',
      title: 'Usage Meter',
      description:
        'Track usage limits for checkout sessions, webhooks, payouts, or subscriptions.',
      files: [
        {
          path: 'components/lomi-ui/usage-meter.tsx',
          target: 'components/lomi-ui/usage-meter.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/usage-meter-demo.tsx',
          target: 'components/lomi-ui/demo/usage-meter-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'payment-failure-card',
      title: 'Payment Failure Card',
      description: 'Help customers retry or recover from a failed payment.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/payment-failure-card.tsx',
          target: 'components/lomi-ui/payment-failure-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/payment-failure-card-demo.tsx',
          target: 'components/lomi-ui/demo/payment-failure-card-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
  ],
};
