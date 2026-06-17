type DocsAgentIndexProps = {
  /** Override the docs site origin (defaults to production). */
  origin?: string;
};

const DEFAULT_ORIGIN = 'https://docs.lomi.africa';

/** Points AI assistants at the curated llms.txt index (Xendit/Flutterwave pattern). */
export function DocsAgentIndex({ origin = DEFAULT_ORIGIN }: DocsAgentIndexProps) {
  return (
    <blockquote className="not-prose my-4 rounded-lg border border-border bg-fd-muted/50 px-4 py-3 text-sm text-fd-muted-foreground">
      <p className="m-0 font-medium text-fd-foreground">Documentation index</p>
      <p className="m-0 mt-1">
        Fetch the complete map at{' '}
        <a href={`${origin}/llms.txt`} className="text-fd-primary underline">
          {origin}/llms.txt
        </a>{' '}
        before integrating. Install agent rules with{' '}
        <code className="text-xs">lomi install-rules</code>.
      </p>
    </blockquote>
  );
}
