/* @proprietary license */

import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as FilesComponents from 'fumadocs-ui/components/files';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import * as icons from 'lucide-react';
import { DocsScreenshot } from '@/components/docs/docs-screenshot';
import { ComponentPreview } from '@/components/preview/component-preview';
import { PaymentFailureCard } from '@/components/lomi-ui/payment-failure-card';
import { CheckoutSummaryCard } from '@/components/lomi-ui/checkout-summary-card';
import { InvoiceHistory } from '@/components/lomi-ui/invoice-history';
import { MobileMoneyCheckoutCard } from '@/components/lomi-ui/mobile-money-checkout-card';
import { PaymentProviderSelector } from '@/components/lomi-ui/payment-provider-selector';
import { PaymentStatusCard } from '@/components/lomi-ui/payment-status-card';
import { PricingTable } from '@/components/lomi-ui/pricing-table';
import { SubscriptionManagementCard } from '@/components/lomi-ui/subscription-management-card';
import { UsageMeter } from '@/components/lomi-ui/usage-meter';
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    ...TabsComponents,
    ...FilesComponents,
    Accordion,
    Accordions,
    Step,
    Steps,
    ComponentPreview,
    DocsScreenshot,
    PaymentFailureCard,
    CheckoutSummaryCard,
    InvoiceHistory,
    MobileMoneyCheckoutCard,
    PaymentProviderSelector,
    PaymentStatusCard,
    PricingTable,
    SubscriptionManagementCard,
    UsageMeter,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
