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
  'pi_spi.webp',
].map((file) => ({
  path: `public/payment_channels/${file}`,
  target: `public/payment_channels/${file}`,
  type: 'registry:file' as const,
}));

const placeholderAssets: LomiUiRegistryAsset[] = ['card.webp', 'bnpl.webp'].map(
  (file) => ({
    path: `public/placeholder/${file}`,
    target: `public/placeholder/${file}`,
    type: 'registry:file' as const,
  }),
);

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
  homepage: 'https://docs.lomi.africa/ui',
  items: [
    {
      name: 'payment-provider-selector',
      title: 'Payment Provider Selector',
      description:
        'Hosted-checkout payment method carousel for Wave, MTN, cards, SPI, and BNPL.',
      files: [
        {
          path: 'components/lomi-ui/payment-provider-selector.tsx',
          target: 'components/lomi-ui/payment-provider-selector.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-card.tsx',
          target: 'components/lomi-ui/lib/checkout-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-ui.css',
          target: 'components/lomi-ui/lib/checkout-ui.css',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/payment-provider-selector-demo.tsx',
          target: 'components/lomi-ui/demo/payment-provider-selector-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: [...paymentChannelAssets, ...placeholderAssets],
    },
    {
      name: 'customer-information-section',
      title: 'Customer Information Section',
      description:
        'Hosted checkout personal information form from customer-information-section.tsx.',
      dependencies: ['lucide-react', 'react-phone-number-input'],
      files: [
        {
          path: 'components/lomi-ui/customer-information-section.tsx',
          target: 'components/lomi-ui/customer-information-section.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-input.tsx',
          target: 'components/lomi-ui/lib/checkout-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-phone-flag.tsx',
          target: 'components/lomi-ui/lib/checkout-phone-flag.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-country-select.tsx',
          target: 'components/lomi-ui/lib/checkout-country-select.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-phone-number-input.tsx',
          target: 'components/lomi-ui/lib/checkout-phone-number-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-whatsapp-number-input.tsx',
          target: 'components/lomi-ui/lib/checkout-whatsapp-number-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-ui.css',
          target: 'components/lomi-ui/lib/checkout-ui.css',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/customer-information-section-demo.tsx',
          target:
            'components/lomi-ui/demo/customer-information-section-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'checkout-submit-button',
      title: 'Checkout Submit Button',
      description:
        'Hosted checkout pay button with processing and outcome states.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/checkout-submit-button.tsx',
          target: 'components/lomi-ui/checkout-submit-button.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/pay-button-contrast.ts',
          target: 'components/lomi-ui/lib/pay-button-contrast.ts',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/checkout-submit-button-demo.tsx',
          target: 'components/lomi-ui/demo/checkout-submit-button-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'mobile-money-checkout-card',
      title: 'Mobile Money Checkout Card',
      description:
        'Provider selection, customer form, and pay button aligned with hosted checkout.',
      dependencies: ['lucide-react', 'react-phone-number-input'],
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
          path: 'components/lomi-ui/lib/checkout-card.tsx',
          target: 'components/lomi-ui/lib/checkout-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-ui.css',
          target: 'components/lomi-ui/lib/checkout-ui.css',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/customer-information-section.tsx',
          target: 'components/lomi-ui/customer-information-section.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-input.tsx',
          target: 'components/lomi-ui/lib/checkout-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-phone-flag.tsx',
          target: 'components/lomi-ui/lib/checkout-phone-flag.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-country-select.tsx',
          target: 'components/lomi-ui/lib/checkout-country-select.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-phone-number-input.tsx',
          target: 'components/lomi-ui/lib/checkout-phone-number-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/checkout-whatsapp-number-input.tsx',
          target: 'components/lomi-ui/lib/checkout-whatsapp-number-input.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/checkout-submit-button.tsx',
          target: 'components/lomi-ui/checkout-submit-button.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/lib/pay-button-contrast.ts',
          target: 'components/lomi-ui/lib/pay-button-contrast.ts',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/mobile-money-checkout-card-demo.tsx',
          target: 'components/lomi-ui/demo/mobile-money-checkout-card-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: paymentChannelAssets.filter((asset) =>
        ['wave.webp', 'mtn.webp', 'pi_spi.webp'].some((file) =>
          asset.path.endsWith(file),
        ),
      ),
    },
    {
      name: 'checkout-summary-card',
      title: 'Checkout Summary Card',
      description:
        'Dark hosted-checkout product summary panel from the left checkout column.',
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
      description:
        'Hosted checkout success outcome card from post/success.tsx.',
      dependencies: ['lucide-react'],
      files: [
        {
          path: 'components/lomi-ui/payment-status-card.tsx',
          target: 'components/lomi-ui/payment-status-card.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/payment-status-card-demo.tsx',
          target: 'components/lomi-ui/demo/payment-status-card-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'price-selector',
      title: 'Price Selector',
      description:
        'Hosted checkout billing cycle selector for the dark product panel.',
      files: [
        {
          path: 'components/lomi-ui/price-selector.tsx',
          target: 'components/lomi-ui/price-selector.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/price-selector-demo.tsx',
          target: 'components/lomi-ui/demo/price-selector-demo.tsx',
          type: 'registry:component',
        },
      ],
    },
    {
      name: 'pricing-table',
      title: 'Pricing Table',
      description:
        'Standalone marketing plan cards. Not the hosted checkout price selector.',
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
      description: 'Hosted checkout error outcome card from post/error.tsx.',
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
    {
      name: 'checkout-footer',
      title: 'Checkout Footer',
      description: 'Hosted checkout footer with lomi branding and legal links.',
      files: [
        {
          path: 'components/lomi-ui/checkout-footer.tsx',
          target: 'components/lomi-ui/checkout-footer.tsx',
          type: 'registry:component',
        },
        {
          path: 'components/lomi-ui/demo/checkout-footer-demo.tsx',
          target: 'components/lomi-ui/demo/checkout-footer-demo.tsx',
          type: 'registry:component',
        },
      ],
      assetFiles: [
        {
          path: 'public/company/lomi_l.webp',
          target: 'public/company/lomi_l.webp',
          type: 'registry:file' as const,
        },
      ],
    },
  ],
};
