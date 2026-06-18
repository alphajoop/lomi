import type { ComponentProps, ReactNode } from 'react';
import {
  CircleCheck,
  CircleX,
  Info,
  Lightbulb,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CalloutType =
  | 'info'
  | 'warn'
  | 'warning'
  | 'error'
  | 'success'
  | 'idea'
  | 'tip';

type ResolvedCalloutType = 'info' | 'warning' | 'error' | 'success' | 'idea';

function resolveType(type?: CalloutType): ResolvedCalloutType {
  if (!type || type === 'tip') return 'info';
  if (type === 'warn') return 'warning';
  return type;
}

const accentVar: Record<ResolvedCalloutType, string> = {
  info: 'var(--color-fd-info)',
  warning: 'var(--color-fd-warning)',
  error: 'var(--color-fd-error, var(--color-fd-destructive))',
  success: 'var(--color-fd-success)',
  idea: 'var(--color-fd-info)',
};

const icons: Record<
  ResolvedCalloutType,
  typeof Info | typeof TriangleAlert | typeof CircleX | typeof CircleCheck | typeof Lightbulb
> = {
  info: Info,
  warning: TriangleAlert,
  error: CircleX,
  success: CircleCheck,
  idea: Lightbulb,
};

type DocsCalloutProps = {
  title?: ReactNode;
  type?: CalloutType;
  emoji?: string;
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<ComponentProps<'div'>, 'title'>;

/** Compact callout for MDX — replaces the default fumadocs box. */
export function DocsCallout({
  title,
  type: inputType = 'info',
  emoji,
  icon,
  children,
  className,
  style,
  ...props
}: DocsCalloutProps) {
  const type = resolveType(inputType);
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'not-prose my-3 flex gap-2 rounded-lg border border-border/80 bg-fd-muted/35 px-3 py-2 text-[0.8125rem] leading-snug',
        className,
      )}
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: accentVar[type],
        ...style,
      }}
      {...props}
    >
      {icon ?? (
        emoji ? (
          <span
            className="mt-px shrink-0 text-[0.875rem] leading-none"
            aria-hidden="true"
          >
            {emoji}
          </span>
        ) : (
          <Icon
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: accentVar[type] }}
            aria-hidden="true"
          />
        )
      )}
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="m-0 font-medium text-fd-foreground">{title}</p>
        ) : null}
        <div
          className={cn(
            'text-fd-muted-foreground',
            title ? 'mt-1' : undefined,
            '[&_p]:m-0',
            '[&_p+p]:mt-1.5',
            '[&_strong]:font-medium [&_strong]:text-fd-foreground',
            '[&_code]:rounded [&_code]:border [&_code]:border-border/60 [&_code]:bg-fd-background/90 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.75rem] [&_code]:font-medium [&_code]:text-fd-foreground',
            '[&_a]:text-fd-primary [&_a]:underline',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { DocsCallout as Callout };
