/* @proprietary license */

import { create } from 'xmlbuilder2';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { glob } from 'tinyglobby';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';

type RouteConfig = {
  priority: string;
  changefreq: string;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://docs.lomi.africa';

function getRouteConfig(urlPath: string): RouteConfig {
  if (urlPath === '/' || urlPath === '/start/overview') {
    return { priority: '1.0', changefreq: 'weekly' };
  }

  if (urlPath.startsWith('/start/')) {
    return { priority: '0.9', changefreq: 'monthly' };
  }

  if (urlPath.startsWith('/api/')) {
    return { priority: '0.8', changefreq: 'weekly' };
  }

  if (urlPath.startsWith('/build/')) {
    return { priority: '0.7', changefreq: 'monthly' };
  }

  if (urlPath.startsWith('/ui/')) {
    return { priority: '0.7', changefreq: 'monthly' };
  }

  return { priority: '0.6', changefreq: 'monthly' };
}

async function collectDocUrls(): Promise<string[]> {
  const files = await glob('content/docs/**/*.mdx', {
    ignore: ['**/*.fr.mdx'],
  });

  const getUrl = createGetUrl('/');
  const urls = new Set<string>();

  for (const file of files) {
    const relativePath = path.relative('content/docs', file);
    urls.add(getUrl(getSlugs(relativePath)));
  }

  urls.add('/');

  return [...urls].sort();
}

function writeSitemap(urlPaths: string[]): void {
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('urlset', {
    xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
  });

  const today =
    new Date().toISOString().split('T')[0] ??
    new Date().toISOString().slice(0, 10);

  for (const urlPath of urlPaths) {
    const config = getRouteConfig(urlPath);
    const url = root.ele('url');
    url.ele('loc').txt(`${BASE_URL}${urlPath}`);
    url.ele('lastmod').txt(today);
    url.ele('changefreq').txt(config.changefreq);
    url.ele('priority').txt(config.priority);
  }

  mkdirSync('public', { recursive: true });
  const outputPath = path.join('public', 'sitemap.xml');
  writeFileSync(outputPath, root.end({ prettyPrint: true }), 'utf8');
  console.log(`Sitemap written to ${outputPath} (${urlPaths.length} URLs)`);
}

export async function generateSitemap(): Promise<void> {
  const urls = await collectDocUrls();
  console.log(`Generating docs sitemap for ${urls.length} routes (${BASE_URL})`);
  writeSitemap(urls);
}

const isMain =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('generate_sitemap.ts') ||
    process.argv[1].endsWith('generate_sitemap.js'));

if (isMain) {
  void generateSitemap().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
