import type { ComponentProps, ReactNode } from 'react';
import { DocsAside } from '@/components/docs/docs-aside';
import type { DocsAsideVariant } from '@/components/docs/docs-aside';

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

type DocsCalloutProps = {
  title?: ReactNode;
  type?: CalloutType;
  emoji?: string;
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<ComponentProps<'div'>, 'title'>;

/** Minimal callout for MDX — no default icon, discreet tinted surface. */
export function DocsCallout({
  title,
  type: inputType = 'info',
  emoji,
  icon,
  children,
  className,
  ...props
}: DocsCalloutProps) {
  const type = resolveType(inputType);

  const asideIcon =
    icon ??
    (emoji ? <span className="text-sm leading-none">{emoji}</span> : undefined);

  return (
    <DocsAside
      variant={type as DocsAsideVariant}
      icon={asideIcon}
      title={title}
      className={className}
      {...props}
    >
      {children}
    </DocsAside>
  );
}

export { DocsCallout as Callout };
