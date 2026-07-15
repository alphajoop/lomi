import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type DocsAsideVariant =
  'info' | 'warning' | 'error' | 'success' | 'idea';

type DocsAsideProps = {
  variant: DocsAsideVariant;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
} & Omit<ComponentProps<'div'>, 'title'>;

/** Shared shell for docs callouts. */
export function DocsAside({
  variant,
  icon,
  title,
  children,
  className,
  ...props
}: DocsAsideProps) {
  return (
    <div
      className={cn(
        'docs-aside not-prose',
        `docs-aside--${variant}`,
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="docs-aside-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="docs-aside-title">{title}</p> : null}
        {children ? (
          <div
            className={cn(
              'docs-aside-body',
              title ? 'docs-aside-body--titled' : undefined,
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
