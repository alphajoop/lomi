/* @proprietary license */

'use client';

import {
  CodeBlock,
  Pre,
  type CodeBlockProps,
} from 'fumadocs-ui/components/codeblock';
import { PersonalizedCodeSurface } from '@/components/docs/personalized-code-surface';
import { DocsFigureCopyButton } from '@/components/docs/docs-figure-copy-button';

export function DocsHighlightedPre({
  children,
  ...figureProps
}: CodeBlockProps) {
  return (
    <PersonalizedCodeSurface>
      <CodeBlock
        {...figureProps}
        Actions={({ className }) => (
          <div className={className}>
            <DocsFigureCopyButton />
          </div>
        )}
      >
        <Pre>{children}</Pre>
      </CodeBlock>
    </PersonalizedCodeSurface>
  );
}
