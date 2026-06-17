type DocsScreenshotProps = {
  /** Path under `/docs/images/` without extension, e.g. `start/create-account` */
  name: string;
  alt: string;
};

/** Theme-aware doc screenshot: `{name}-light.webp` and `{name}-dark.webp` in `public/docs/images/`. */
export function DocsScreenshot({ name, alt }: DocsScreenshotProps) {
  const base = `/docs/images/${name}`;

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-border">
      <img
        src={`${base}-light.webp`}
        alt={alt}
        className="block w-full dark:hidden"
        loading="lazy"
      />
      <img
        src={`${base}-dark.webp`}
        alt={alt}
        className="hidden w-full dark:block"
        loading="lazy"
      />
    </figure>
  );
}
