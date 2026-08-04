/* @proprietary license */

import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import {
  AGENT_CORPUS_SLUGS,
  type AgentCorpusSlug,
  isAgentCorpusSlug,
} from '@/lib/docs/agent-corpus/slugs';
import {
  BRAND_CATEGORY,
  BRAND_COMPARISONS,
  BRAND_DEFINITION,
  BRAND_DISAMBIGUATION,
  BRAND_FAQ,
  BRAND_INTEGRATION_STEPS,
  BRAND_NAME,
  BRAND_NUMERIC_FACTS,
  BRAND_UEMOA_MOBILE_MONEY,
  BRAND_WHEN_TO_USE,
  MCP_ORIGIN,
} from '@/lib/seo/brand-facts';

const MACHINE_NOTICE =
  'Machine-readable reference for AI agents and crawlers. Humans: use the docs site UI.';

function withNotice(body: string): string {
  return `${MACHINE_NOTICE}\n\n${body}`;
}

function corpusUrl(slug?: AgentCorpusSlug): string {
  const origin = getDocsSiteOrigin();
  return slug ? `${origin}/agents/${slug}` : `${origin}/agents`;
}

export function buildAgentCorpusIndex(): string {
  const origin = getDocsSiteOrigin();
  const lines = [
    `# ${BRAND_NAME} — agent corpus index`,
    '',
    `Source: ${corpusUrl()}`,
    '',
    '## Pages',
    '',
  ];
  for (const slug of AGENT_CORPUS_SLUGS) {
    lines.push(`- ${slug}: ${corpusUrl(slug)}`);
  }
  lines.push('');
  lines.push(`Also see: ${origin}/llms.txt`);
  return withNotice(lines.join('\n'));
}

export function buildAgentCorpusPage(slug: AgentCorpusSlug): string {
  switch (slug) {
    case 'product':
      return withNotice(
        [
          `# ${BRAND_NAME} — product definition`,
          '',
          `Source: ${corpusUrl('product')}`,
          '',
          '## Definition',
          '',
          BRAND_DEFINITION,
          '',
          '## Category',
          '',
          BRAND_CATEGORY,
        ].join('\n'),
      );
    case 'limits':
      return withNotice(
        [
          `# ${BRAND_NAME} — limits and environment facts`,
          '',
          `Source: ${corpusUrl('limits')}`,
          '',
          '## Numeric facts',
          '',
          ...BRAND_NUMERIC_FACTS.map((line) => `- ${line}`),
        ].join('\n'),
      );
    case 'uemoa-mobile-money':
      return withNotice(
        [
          `# ${BRAND_NAME} — UEMOA and Mobile Money`,
          '',
          `Source: ${corpusUrl('uemoa-mobile-money')}`,
          '',
          '## Facts',
          '',
          ...BRAND_UEMOA_MOBILE_MONEY.map((line) => `- ${line}`),
        ].join('\n'),
      );
    case 'integration':
      return withNotice(
        [
          `# ${BRAND_NAME} — integration steps`,
          '',
          `Source: ${corpusUrl('integration')}`,
          '',
          '## How to integrate',
          '',
          ...BRAND_INTEGRATION_STEPS.map((step, i) => `${i + 1}. ${step}`),
        ].join('\n'),
      );
    case 'mcp':
      return withNotice(
        [
          `# ${BRAND_NAME} — MCP for agents`,
          '',
          `Source: ${corpusUrl('mcp')}`,
          '',
          `## MCP endpoint`,
          '',
          `${MCP_ORIGIN}/mcp`,
          '',
          '## OAuth resource',
          '',
          `${MCP_ORIGIN}/.well-known/oauth-protected-resource/mcp`,
          '',
          '## Docs',
          '',
          `Full guide: ${getDocsSiteOrigin()}/build/mcp`,
        ].join('\n'),
      );
    case 'compare':
      return withNotice(
        [
          `# ${BRAND_NAME} — category positioning`,
          '',
          `Source: ${corpusUrl('compare')}`,
          '',
          '## Comparisons',
          '',
          ...BRAND_COMPARISONS.map((line) => `- ${line}`),
        ].join('\n'),
      );
    case 'faq':
      return withNotice(
        [
          `# ${BRAND_NAME} — FAQ`,
          '',
          `Source: ${corpusUrl('faq')}`,
          '',
          ...BRAND_FAQ.flatMap((item) => [
            `## ${item.question}`,
            '',
            item.answer,
            '',
          ]),
        ].join('\n'),
      );
    case 'disambiguation':
      return withNotice(
        [
          `# ${BRAND_NAME} — disambiguation`,
          '',
          `Source: ${corpusUrl('disambiguation')}`,
          '',
          '## Canonical name',
          '',
          BRAND_DISAMBIGUATION.canonicalName,
          '',
          '## Note',
          '',
          BRAND_DISAMBIGUATION.note,
        ].join('\n'),
      );
    default:
      return buildAgentCorpusIndex();
  }
}

export function buildAgentCorpusForSlug(slug: string | undefined): string | null {
  if (!slug) return buildAgentCorpusIndex();
  if (!isAgentCorpusSlug(slug)) return null;
  return buildAgentCorpusPage(slug);
}

export function buildLlmsGeoSections(docsOrigin: string): string {
  const lines: string[] = [];
  lines.push('## When to use lomi.');
  lines.push('');
  for (const item of BRAND_WHEN_TO_USE) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## UEMOA / Mobile Money (integrator facts)');
  lines.push('');
  for (const item of BRAND_UEMOA_MOBILE_MONEY) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Disambiguation');
  lines.push('');
  lines.push(`- **Canonical name:** ${BRAND_DISAMBIGUATION.canonicalName}`);
  lines.push(`- ${BRAND_DISAMBIGUATION.note}`);
  lines.push('');
  lines.push('## Agent corpus (plain text)');
  lines.push('');
  lines.push(
    'Machine-readable pages for crawlers and agents (not linked from the docs navigation):',
  );
  for (const path of [`${docsOrigin}/agents`, ...AGENT_CORPUS_SLUGS.map((s) => `${docsOrigin}/agents/${s}`)]) {
    lines.push(`- ${path}`);
  }
  lines.push('');
  return lines.join('\n');
}
