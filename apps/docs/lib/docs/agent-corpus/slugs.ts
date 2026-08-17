/* @proprietary license */

export const AGENT_CORPUS_SLUGS = [
  'product',
  'limits',
  'uemoa-mobile-money',
  'integration',
  'mcp',
  'compare',
  'faq',
  'disambiguation',
] as const;

export type AgentCorpusSlug = (typeof AGENT_CORPUS_SLUGS)[number];

export function isAgentCorpusSlug(value: string): value is AgentCorpusSlug {
  // SAFETY: Boundary value matches the asserted domain type at this call site.
  return (AGENT_CORPUS_SLUGS as readonly string[]).includes(value);
}

export const AGENT_CORPUS_ROUTES: readonly string[] = [
  '/agents',
  ...AGENT_CORPUS_SLUGS.map((slug) => `/agents/${slug}`),
];
