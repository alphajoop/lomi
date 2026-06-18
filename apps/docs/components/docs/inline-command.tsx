type InlineCommandProps = {
  children: string;
};

/** Inline terminal command styling for prose and callouts. */
export function InlineCommand({ children }: InlineCommandProps) {
  return (
    <code className="docs-inline-command">{children}</code>
  );
}
