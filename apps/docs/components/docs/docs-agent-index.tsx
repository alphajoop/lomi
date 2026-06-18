import { InlineCommand } from '@/components/docs/inline-command';
import { getDocsLocale } from '@/lib/utils/docs-locale';
import type { Language } from '@/lib/i18n/config';

type DocsAgentIndexProps = {
  /** Override the docs site origin (defaults to production). */
  origin?: string;
};

const DEFAULT_ORIGIN = 'https://docs.lomi.africa';

const COPY: Record<
  Language,
  {
    title: string;
    beforeUrl: string;
    between: string;
    after: string;
    command: string;
  }
> = {
  en: {
    title: 'Documentation index',
    beforeUrl: 'Fetch the complete map at',
    between: 'before integrating. Install agent rules with',
    after: '.',
    command: 'lomi install-rules',
  },
  fr: {
    title: 'Index de documentation',
    beforeUrl: 'Récupérez la carte complète sur',
    between: "avant d'intégrer. Installez les règles agent avec",
    after: '.',
    command: 'lomi install-rules',
  },
};

/** Points AI assistants at the curated llms.txt index (Xendit/Flutterwave pattern). */
export async function DocsAgentIndex({
  origin = DEFAULT_ORIGIN,
}: DocsAgentIndexProps) {
  const locale = await getDocsLocale();
  const copy = COPY[locale] ?? COPY.en;

  return (
    <aside className="docs-agent-index not-prose" aria-label={copy.title}>
      <p className="docs-agent-index-text">
        <span className="docs-agent-index-label">{copy.title}</span>
        {copy.beforeUrl} <a href={`${origin}/llms.txt`}>{origin}/llms.txt</a>{' '}
        {copy.between} <InlineCommand>{copy.command}</InlineCommand>
        {copy.after}
      </p>
    </aside>
  );
}
