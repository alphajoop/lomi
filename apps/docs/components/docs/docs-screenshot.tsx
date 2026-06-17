type DocsScreenshotProps = {
  /** Path under `/docs/images/` without extension, e.g. `start/create-account` */
  name: string;
  alt: string;
};

/** Theme-aware doc screenshot: `{name}-light.webp` and `{name}-dark.webp` in `public/docs/images/`. */
export function DocsScreenshot({ name, alt }: DocsScreenshotProps) {
  const base = `/docs/images/${name}`;

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-border aspect-video w-full">
      <img
        src={`${base}-light.webp`}
        alt={alt}
        className="block size-full object-cover object-center dark:hidden"
        loading="lazy"
        width={1280}
        height={720}
      />
      <img
        src={`${base}-dark.webp`}
        alt={alt}
        className="hidden size-full object-cover object-center dark:block"
        loading="lazy"
        width={1280}
        height={720}
      />
    </figure>
  );
}
