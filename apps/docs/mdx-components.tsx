/* @proprietary license */

import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as FilesComponents from 'fumadocs-ui/components/files';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import * as icons from 'lucide-react';
import { ComponentPreview } from '@/components/preview/component-preview';
import { CheckoutFooter } from '@/components/lomi-ui/checkout-footer';
import { CheckoutSubmitButton } from '@/components/lomi-ui/checkout-submit-button';
import { CustomerInformationSection } from '@/components/lomi-ui/customer-information-section';
import { PaymentFailureCard } from '@/components/lomi-ui/payment-failure-card';
import { CheckoutSummaryCard } from '@/components/lomi-ui/checkout-summary-card';
import { MobileMoneyCheckoutCard } from '@/components/lomi-ui/mobile-money-checkout-card';
import { PaymentProviderSelector } from '@/components/lomi-ui/payment-provider-selector';
import { PaymentStatusCard } from '@/components/lomi-ui/payment-status-card';
import { PricingTable } from '@/components/lomi-ui/pricing-table';
import { PriceSelector } from '@/components/lomi-ui/price-selector';
import { SubscriptionManagementCard } from '@/components/lomi-ui/subscription-management-card';
import { UsageMeter } from '@/components/lomi-ui/usage-meter';
import { DocsScreenshot } from '@/components/docs/docs-screenshot';
import { DocsAgentIndex } from '@/components/docs/docs-agent-index';
import { InlineCommand } from '@/components/docs/inline-command';
import { Callout } from '@/components/docs/docs-callout';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    Callout,
    ...TabsComponents,
    ...FilesComponents,
    Accordion,
    Accordions,
    Step,
    Steps,
    ComponentPreview,
    CheckoutFooter,
    CheckoutSubmitButton,
    CustomerInformationSection,
    PaymentFailureCard,
    CheckoutSummaryCard,
    MobileMoneyCheckoutCard,
    PaymentProviderSelector,
    PaymentStatusCard,
    PriceSelector,
    PricingTable,
    SubscriptionManagementCard,
    UsageMeter,
    DocsScreenshot,
    DocsAgentIndex,
    InlineCommand,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
