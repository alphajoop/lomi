'use client';

import Image from 'next/image';
import { useState } from 'react';

type DocsScreenshotProps = {
  /** Path under `/docs/images/` without extension, e.g. `start/create-account` */
  name: string;
  alt: string;
};

const screenshotImageClassName =
  'absolute inset-0 m-0 size-full max-w-none object-cover object-center shadow-none';

/** Theme-aware doc screenshot with graceful fallback when WebP assets are not yet captured. */
export function DocsScreenshot({ name, alt }: DocsScreenshotProps) {
  const base = `/docs/images/${name}`;
  const [missingTheme, setMissingTheme] = useState<
    'none' | 'light' | 'dark' | 'both'
  >('none');

  const onLightError = () => {
    setMissingTheme((prev) => (prev === 'dark' ? 'both' : 'light'));
  };

  const onDarkError = () => {
    setMissingTheme((prev) => (prev === 'light' ? 'both' : 'dark'));
  };

  if (missingTheme === 'both') {
    return (
      <figure className="not-prose my-6 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-fd-muted/30 px-4 text-center text-sm text-fd-muted-foreground">
        <span className="font-medium text-fd-foreground">{alt}</span>
        <span>
          Screenshot pending — add{' '}
          <code className="text-xs">{name}-light.webp</code> and{' '}
          <code className="text-xs">{name}-dark.webp</code> per{' '}
          <code className="text-xs">SCREENSHOT-MANIFEST.md</code>.
        </span>
      </figure>
    );
  }

  return (
    <figure className="not-prose relative my-6 aspect-video w-full overflow-hidden rounded-lg border border-border">
      {missingTheme !== 'light' ? (
        <Image
          src={`${base}-light.webp`}
          alt={alt}
          className={`${screenshotImageClassName} dark:hidden`}
          loading="lazy"
          width={1280}
          height={720}
          onError={onLightError}
        />
      ) : null}
      {missingTheme !== 'dark' ? (
        <Image
          src={`${base}-dark.webp`}
          alt={alt}
          className={`${screenshotImageClassName} hidden dark:block`}
          loading="lazy"
          width={1280}
          height={720}
          onError={onDarkError}
        />
      ) : null}
      {missingTheme === 'light' ? (
        <Image
          src={`${base}-dark.webp`}
          alt={alt}
          className={`${screenshotImageClassName} dark:hidden`}
          loading="lazy"
          width={1280}
          height={720}
          onError={onDarkError}
        />
      ) : null}
      {missingTheme === 'dark' ? (
        <Image
          src={`${base}-light.webp`}
          alt={alt}
          className={`${screenshotImageClassName} hidden dark:block`}
          loading="lazy"
          width={1280}
          height={720}
          onError={onLightError}
        />
      ) : null}
    </figure>
  );
}
