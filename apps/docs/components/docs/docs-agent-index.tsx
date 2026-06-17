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
    <blockquote className="not-prose my-4 flex flex-col gap-1 rounded-lg border border-border bg-fd-muted/50 px-4 py-2.5 text-sm text-fd-muted-foreground">
      <p className="m-0 font-medium leading-snug text-fd-foreground">
        {copy.title}
      </p>
      <p className="m-0 leading-snug">
        {copy.beforeUrl}{' '}
        <a href={`${origin}/llms.txt`} className="text-fd-primary underline">
          {origin}/llms.txt
        </a>{' '}
        {copy.between} <InlineCommand>{copy.command}</InlineCommand>
        {copy.after}
      </p>
    </blockquote>
  );
}
