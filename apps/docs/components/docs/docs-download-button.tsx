import { Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type DocsDownloadButtonProps = {
  /** Path on docs.lomi.africa, e.g. `/downloads/woo-lomi.zip` */
  href: string;
  /** Display label, e.g. `Download woo-lomi.zip` */
  label: string;
  /** Optional version badge, e.g. `1.003.0` */
  version?: string;
  /** Suggested filename for the browser save dialog */
  filename?: string;
  className?: string;
};

/** Merchant-facing download CTA — no GitHub UI required. */
export function DocsDownloadButton({
  href,
  label,
  version,
  filename,
  className,
}: DocsDownloadButtonProps) {
  return (
    <div
      className={cn(
        'not-prose my-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-fd-muted/30 p-4',
        className,
      )}
    >
      <a
        href={href}
        download={filename}
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground',
          'transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
        )}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        {label}
      </a>
      {version ? (
        <span className="text-sm text-fd-muted-foreground">
          Version <strong className="text-fd-foreground">{version}</strong>
        </span>
      ) : null}
    </div>
  );
}
