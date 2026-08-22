/* @proprietary license */

import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as FilesComponents from 'fumadocs-ui/components/files';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import * as icons from 'lucide-react';
import { ComponentPreview } from '@/components/preview/component-preview';
import { CustomerInformationSection } from '@/components/lomi-ui/customer-information-section';
import { CheckoutSummaryCard } from '@/components/lomi-ui/checkout-summary-card';
import { MobileMoneyCheckoutCard } from '@/components/lomi-ui/mobile-money-checkout-card';
import { PaymentProviderSelector } from '@/components/lomi-ui/payment-provider-selector';
import {
  MobileMoneyCheckoutCardDemo,
  PaymentProviderSelectorDemo,
} from '@/components/lomi-ui/demo';
import { PriceSelector } from '@/components/lomi-ui/price-selector';
import { UsageMeter } from '@/components/lomi-ui/usage-meter';
import { DocsScreenshot } from '@/components/docs/docs-screenshot';
import { DocsAgentIndex } from '@/components/docs/docs-agent-index';
import { InlineCommand } from '@/components/docs/inline-command';
import { Callout } from '@/components/docs/docs-callout';
import { McpOauthConnect } from '@/components/docs/mcp-oauth-connect';
import { DocsDownloadButton } from '@/components/docs/docs-download-button';
import {
  IntegrationSurface,
  IntegrationSurfaceGroup,
} from '@/components/docs/integration-surface-group';
import { McpOperationIndex } from '@/components/docs/mcp-operation-index';

function lucideIconsAsMdx(): MDXComponents {
  const components: MDXComponents = {};
  for (const [name, icon] of Object.entries(icons)) {
    if (typeof icon === 'function' && icon.length <= 1) {
      components[name] = icon as MDXComponents[string];
    }
  }
  return components;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...lucideIconsAsMdx(),
    ...defaultMdxComponents,
    Callout,
    DocsDownloadButton,
    McpOauthConnect,
    ...TabsComponents,
    ...FilesComponents,
    Accordion,
    Accordions,
    Step,
    Steps,
    ComponentPreview,
    CustomerInformationSection,
    CheckoutSummaryCard,
    MobileMoneyCheckoutCard,
    MobileMoneyCheckoutCardDemo,
    PaymentProviderSelector,
    PaymentProviderSelectorDemo,
    PriceSelector,
    UsageMeter,
    DocsScreenshot,
    DocsAgentIndex,
    InlineCommand,
    IntegrationSurfaceGroup,
    IntegrationSurface,
    McpOperationIndex,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
