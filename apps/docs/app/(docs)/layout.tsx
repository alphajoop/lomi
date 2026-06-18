/* @proprietary license */

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions, linkItems, logo } from '@/lib/utils/layout.shared';
import { source } from '@/lib/utils/source';
import { getDocsLocale } from '@/lib/utils/docs-locale';
// import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import type { CSSProperties, ReactNode } from 'react';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import type { Folder, Node, Root } from 'fumadocs-core/page-tree';
import { t as translate } from '@/lib/i18n/translations';
import type { Language } from '@/lib/i18n/config';
// import { Sparkles } from 'lucide-react';
// import { AISearchTrigger } from '@/components/ai';
// import { cn } from '@/lib/cn';
// import { buttonVariants } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import { TryItOpenApiPanel } from '@/components/docs/try-it-openapi-panel';

function getFirstPageUrl(node: Folder): string | undefined {
  if (node.index?.url) return node.index.url;

  for (const child of node.children) {
    if (child.type === 'page') return child.url;
    if (child.type === 'folder') {
      const nested = getFirstPageUrl(child);
      if (nested) return nested;
    }
  }

  return undefined;
}

const SECTION_LABEL_KEYS: Record<string, string> = {
  Start: 'section.start',
  Build: 'section.build',
  Resources: 'section.resources',
  'First steps': 'section.firstSteps',
  'API Reference': 'section.apiReference',
  'REST API': 'section.restApi',
  Basics: 'section.basics',
  Implementation: 'section.implementation',
  Community: 'section.community',
  Management: 'section.management',
};

const SECTION_DESCRIPTION_KEYS: Record<string, string> = {
  'Understand lomi., create your account, get API keys, make a test payment, and go live.':
    'sectionDescription.start',
  'Choose an integration path and build checkout, payment links, subscriptions, webhooks, and tools.':
    'sectionDescription.build',
  'Authentication, errors, data models, and endpoint reference for the lomi. API.':
    'sectionDescription.apiReference',
  'Support, changelog, merchant policies, open-source material, and contributor documentation.':
    'sectionDescription.resources',
  'Developers use lomi. to reliably accept payments in West Africa.':
    'sectionDescription.firstSteps',
  'Complete reference to building with lomi. API.':
    'sectionDescription.apiReference',
  'Payment and commerce endpoints.': 'sectionDescription.restApi',
};

function localizeTreeLabel(value: ReactNode, locale: Language): ReactNode {
  if (typeof value !== 'string') return value;

  const key = SECTION_LABEL_KEYS[value];
  if (!key) return value;

  return translate(key, locale);
}

function localizeTreeDescription(
  value: ReactNode,
  locale: Language,
): ReactNode {
  if (typeof value !== 'string') return value;

  const key = SECTION_DESCRIPTION_KEYS[value];
  if (!key) return value;

  return translate(key, locale);
}

function localizeNode(node: Node, locale: Language): Node {
  if (node.type === 'folder') {
    return {
      ...node,
      name: localizeTreeLabel(node.name, locale),
      children: node.children.map((child) => localizeNode(child, locale)),
    };
  }

  if (node.type === 'separator') {
    return {
      ...node,
      name: localizeTreeLabel(node.name, locale),
    };
  }

  return node;
}

function localizeTree(root: Root, locale: Language): Root {
  return {
    ...root,
    name: localizeTreeLabel(root.name, locale),
    children: root.children.map((node) => localizeNode(node, locale)),
  };
}

export default async function Layout({ children }: { children: ReactNode }) {
  const locale = await getDocsLocale();
  const requestedTree = source.getPageTree(locale);
  const fallbackLocale: Language = locale === 'fr' ? 'en' : 'fr';
  const treeLocale =
    requestedTree.children.length > 0 ? locale : fallbackLocale;
  const pageTree = localizeTree(source.getPageTree(treeLocale), treeLocale);
  const base = baseOptions();
  const tabs: LayoutTab[] = pageTree.children.flatMap((node) => {
    if (node.type !== 'folder') return [];

    const url = getFirstPageUrl(node);
    if (!url) return [];

    const meta = source.getNodeMeta(node, locale);
    const color = meta
      ? `var(--${meta.path.split('/')[0]}-color, var(--color-fd-foreground))`
      : 'var(--color-fd-foreground)';

    return [
      {
        title: node.name,
        description: localizeTreeDescription(node.description, locale),
        url,
        $folder: node,
        icon: node.icon ? (
          <div
            className="[&_svg]:size-full rounded-sm size-full text-(--tab-color) max-md:bg-(--tab-color)/10 max-md:border max-md:p-1.5"
            style={
              {
                '--tab-color': color,
              } as CSSProperties
            }
          >
            {node.icon}
          </div>
        ) : undefined,
      },
    ];
  });

  return (
    <DocsLayout
      {...base}
      i18n={false}
      tree={pageTree}
      tabs={tabs}
      // just icon items
      links={linkItems?.filter((item) => item.type === 'icon') ?? []}
      searchToggle={
        {
          /*
        components: {
          lg: (
            <div className="flex gap-1.5 max-md:hidden">
              <LargeSearchToggle className="flex-1" />
            </div>
          ),
        },
        */
        }
      }
      nav={{
        ...base.nav,
        title: <>{logo}</>,
        // children: (
        //   <AISearchTrigger
        //     className={cn(
        //       buttonVariants({
        //         variant: 'secondary',
        //         size: 'sm',
        //         className:
        //           'absolute left-1/2 top-1/2 -translate-1/2 text-fd-muted-foreground rounded-sm gap-2 md:hidden',
        //       }),
        //     )}
        //   >
        //     <Sparkles className="size-4.5 fill-current" />
        //     Ask AI
        //   </AISearchTrigger>
        // ),
      }}
      sidebar={{}}
    >
      <TryItOpenApiPanel />
      {children}
    </DocsLayout>
  );
}
