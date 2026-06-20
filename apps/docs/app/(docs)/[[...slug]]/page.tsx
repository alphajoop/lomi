/* @proprietary license */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { type ComponentProps, type FC, type ReactNode, type JSX } from 'react';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { Callout } from '@/components/docs/docs-callout';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import * as Preview from '@/components/preview';
import { createMetadata, getDocsSiteOrigin } from '@/lib/utils/metadata';
import { source } from '@/lib/utils/source';
import { getDocsLocale } from '@/lib/utils/docs-locale';
import type { Language } from '@/lib/i18n/config';
import { Wrapper } from '@/components/preview/wrapper';
import { getMDXComponents } from '@/mdx-components';
import Link from 'fumadocs-core/link';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createGenerator } from 'fumadocs-typescript';
import { getPageTreePeers } from 'fumadocs-core/page-tree';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { LLMCopyButton, ViewOptions } from '@/components/preview/page-actions';
import * as path from 'node:path';
import { Banner } from 'fumadocs-ui/components/banner';
import { Installation } from '@/components/preview/installation';
import { Customisation } from '@/components/preview/customisation';
import { DocsPage } from 'fumadocs-ui/page';

const DEFAULT_DOC_SLUG = ['start', 'overview'] as const;

function effectiveSlug(slug: string[] | undefined): string[] {
  if (slug && slug.length > 0) return slug;
  return [...DEFAULT_DOC_SLUG];
}

function getFallbackLanguage(locale: Language): Language {
  return locale === 'fr' ? 'en' : 'fr';
}

function resolvePageForLocale(slug: string[], locale: Language) {
  const primary = source.getPage(slug, locale);
  if (primary) return { page: primary, resolvedLocale: locale };

  const fallbackLocale = getFallbackLanguage(locale);
  const fallback = source.getPage(slug, fallbackLocale);
  if (fallback) return { page: fallback, resolvedLocale: fallbackLocale };

  return { page: null, resolvedLocale: locale };
}

function PreviewRenderer({ preview }: { preview: string }): ReactNode {
  if (preview && preview in Preview) {
    const Comp = Preview[preview as keyof typeof Preview];
    return <Comp />;
  }

  return null;
}

const generator = createGenerator();

export const revalidate = false;

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  if (!resolvedParams.slug || resolvedParams.slug.length === 0) {
    redirect(`/${DEFAULT_DOC_SLUG.join('/')}`);
  }

  const slug = effectiveSlug(resolvedParams.slug);
  const locale = await getDocsLocale();
  const { page, resolvedLocale } = resolvePageForLocale(slug, locale);

  if (!page) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = page.data as any;

  const preview = pageData.preview as string | undefined;
  const Mdx = pageData.body;
  const toc = pageData.toc;
  const lastModified = pageData.lastModified;

  return (
    <DocsPage
      toc={toc}
      lastUpdate={lastModified ? new Date(lastModified) : undefined}
      tableOfContent={{
        style: 'clerk',
      }}
    >
      <div className="docs-page-header">
        <div className="docs-page-header-main">
          <h1 className="docs-page-title font-semibold">{page.data.title}</h1>
          <p className="docs-page-description">{page.data.description}</p>
        </div>
        <div className="docs-page-actions">
          <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
          <ViewOptions
            markdownUrl={`${page.url}.mdx`}
            githubUrl={`https://github.com/lomiafrica/lomi./tree/main/apps/docs/content/docs/${page.path}`}
          />
        </div>
      </div>
      <div className="prose flex-1 text-fd-foreground/80">
        {preview ? <PreviewRenderer preview={preview} /> : null}
        <Mdx
          components={getMDXComponents({
            ...Twoslash,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            a: ({ href, children, ...props }: any): JSX.Element => {
              const resolvedHref = typeof href === 'string' ? href : '';
              const found = source.getPageByHref(resolvedHref, {
                dir: path.dirname(page.path),
                language: resolvedLocale,
              });

              if (!found) {
                return (
                  <Link href={resolvedHref} {...props}>
                    {children}
                  </Link>
                );
              }

              const targetHref = found.hash
                ? `${found.page.url}#${found.hash}`
                : found.page.url;
              return (
                <Link href={targetHref} {...props}>
                  {children}
                </Link>
              );
            },
            Banner,
            TypeTable,
            AutoTypeTable: (props) => (
              <AutoTypeTable generator={generator} {...props} />
            ),
            Wrapper,
            blockquote: Callout as unknown as FC<ComponentProps<'blockquote'>>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            DocsCategory: ({ url }: any): JSX.Element => {
              return <DocsCategory url={url ?? page.url} locale={locale} />;
            },
            Installation,
            Customisation,
          })}
        />
        {pageData.index ? (
          <DocsCategory url={page.url} locale={resolvedLocale} />
        ) : null}
      </div>
    </DocsPage>
  );
}

function DocsCategory({ url, locale }: { url: string; locale: Language }) {
  const peers = getPageTreePeers(source.getPageTree(locale), url);
  const peersArray = Array.isArray(peers) ? peers : [];

  if (peersArray.length === 0) return null;

  return (
    <div className="not-prose my-5">
      <Cards className="gap-3">
        {peersArray.map((peer) => (
          <Card key={peer.url} title={peer.name} href={peer.url}>
            {peer.description}
          </Card>
        ))}
      </Cards>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = effectiveSlug(resolvedParams.slug);
  const locale = await getDocsLocale();
  const { page } = resolvePageForLocale(slug, locale);
  if (!page) notFound();

  const description =
    page.data.description ?? 'The library for building documentation sites';

  const origin = getDocsSiteOrigin();
  const ogPath = [...page.slugs, 'image.png'].join('/');
  const image = {
    url: `${origin}/og/${ogPath}`,
    width: 1200,
    height: 630,
  };

  const canonicalPath = page.url.startsWith('/') ? page.url : `/${page.url}`;
  const canonical = `${origin}${canonicalPath}`;

  return createMetadata({
    title: page.data.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonicalPath,
      images: [image],
    },
    twitter: {
      images: [image],
    },
  });
}

export function generateStaticParams() {
  const list = source
    .getPages('en')
    .map((p) => ({ slug: p.slugs }) as { slug: string[] });
  const withoutEmpty = list.filter((p) => (p.slug?.length ?? 0) > 0);
  return [{ slug: [] }, ...withoutEmpty];
}
