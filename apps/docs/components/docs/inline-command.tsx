type InlineCommandProps = {
  children: string;
};

/** Inline terminal command styling for prose and callouts. */
export function InlineCommand({ children }: InlineCommandProps) {
  return (
    <code className="rounded-md border border-border bg-fd-background px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium text-fd-foreground">
      {children}
    </code>
  );
}
