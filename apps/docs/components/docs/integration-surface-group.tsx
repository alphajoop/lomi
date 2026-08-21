/* @proprietary license */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@lomi./ui/cn';

export type IntegrationSurfaceKind = 'api' | 'sdk' | 'cli' | 'mcp';

type IntegrationSurfaceGroupProps = {
  children?: ReactNode;
  className?: string;
  id?: string;
};

type IntegrationSurfaceProps = {
  transport: IntegrationSurfaceKind;
  title: string;
  identifier?: string;
  href?: string;
  hrefLabel?: string;
  defaultOpen?: boolean;
  id?: string;
  children?: ReactNode;
};

function surfaceLabel(kind: IntegrationSurfaceKind): string {
  switch (kind) {
    case 'api':
      return 'REST API';
    case 'sdk':
      return 'SDK';
    case 'cli':
      return 'CLI';
    case 'mcp':
      return 'MCP';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function surfaceAnchorId(
  id: string | undefined,
  transport: IntegrationSurfaceKind,
): string {
  return id ?? `call-${transport}`;
}

export function IntegrationSurfaceGroup({
  children,
  className,
  id,
}: IntegrationSurfaceGroupProps) {
  return (
    <div id={id} className={cn('docs-surface-group', className)}>
      {children}
    </div>
  );
}

export function IntegrationSurface({
  transport,
  title,
  identifier,
  href,
  hrefLabel,
  defaultOpen,
  id,
  children,
}: IntegrationSurfaceProps) {
  const label = surfaceLabel(transport);

  return (
    <details
      id={surfaceAnchorId(id, transport)}
      className="docs-surface-card"
      open={defaultOpen}
    >
      <summary className="docs-surface-summary">
        <span className="docs-surface-summary-row">
          <span
            className={cn(
              'docs-surface-pill',
              `docs-surface-pill--${transport}`,
            )}
          >
            {label}
          </span>
          <span className="docs-surface-summary-copy">
            <span className="docs-surface-title">{title}</span>
            {identifier ? (
              <span className="docs-surface-identifier">{identifier}</span>
            ) : null}
          </span>
          <span aria-hidden="true" className="docs-surface-toggle">
            +
          </span>
        </span>
      </summary>
      <div className="docs-surface-body">
        {children}
        {href && hrefLabel ? (
          <p className="docs-surface-link-wrap">
            <Link href={href} className="docs-surface-link">
              {hrefLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </details>
  );
}
