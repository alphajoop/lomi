/* @proprietary license */

import { cn } from '@/lib/utils/cn';

type DocsScreenshotProps = {
  /** Path under `public/docs/images/` without theme suffix, e.g. `start/create-account`. */
  name: string;
  alt: string;
  className?: string;
};

const imageClassName =
  'w-full rounded-lg border border-border/40 object-cover aspect-video';

/**
 * Theme-aware docs screenshot (`{name}-light.webp` / `{name}-dark.webp`).
 * Drop files in `public/docs/images/` — see SCREENSHOT-MANIFEST.md.
 */
export function DocsScreenshot({ name, alt, className }: DocsScreenshotProps) {
  const base = `/docs/images/${name}`;

  return (
    <span className={cn('not-prose my-6 block overflow-hidden', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-light.webp`}
        alt={alt}
        width={1280}
        height={720}
        className={cn(imageClassName, 'dark:hidden')}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-dark.webp`}
        alt={alt}
        width={1280}
        height={720}
        className={cn(imageClassName, 'hidden dark:block')}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
