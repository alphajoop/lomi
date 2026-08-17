export type OptimizeImageResize = "cover" | "contain";

/**
 * Rewrite public Supabase object URLs to render/image transforms when enabled.
 * Pure URL helper — no Supabase client.
 */
export function optimizeImage(
  url: string | null | undefined,
  width: number,
  height?: number,
  resize: OptimizeImageResize = "cover",
  transformsEnabled = false,
): string | undefined {
  if (!url) return undefined;

  if (!url.includes("supabase.co/storage/v1/")) {
    return url;
  }

  if (url.includes("/render/image/")) {
    return url;
  }

  if (!url.includes("/object/public/")) {
    return url;
  }

  if (!transformsEnabled) {
    return url;
  }

  const transformedUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );

  const params = new URLSearchParams();
  params.append("width", width.toString());
  if (height) params.append("height", height.toString());
  params.append("resize", resize);

  const separator = transformedUrl.includes("?") ? "&" : "?";
  return `${transformedUrl}${separator}${params.toString()}`;
}

export function extractStorageObjectPath(
  urlStr: string,
  bucketName: string,
): string | null {
  try {
    const urlObj = new URL(urlStr);
    const splitToken = `/${bucketName}/`;
    const pathParts = urlObj.pathname.split(splitToken);

    if (pathParts.length > 1) {
      const relativePath = pathParts[1]?.split("?")[0]?.trim();
      return relativePath || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function processStorageUrl(
  urlStr: string | null,
  bucketName: string,
  getPublicUrl: (bucket: string, path: string) => string | undefined,
): string | undefined {
  if (!urlStr) return undefined;

  const trimmed = urlStr.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return undefined;

  if (trimmed.startsWith("http")) {
    const isSupabaseStorageUrl =
      trimmed.includes("supabase") || trimmed.includes("/storage/v1/");

    if (isSupabaseStorageUrl) {
      const relativePath = extractStorageObjectPath(trimmed, bucketName);
      if (relativePath) {
        return getPublicUrl(bucketName, relativePath);
      }
      return trimmed;
    }

    return trimmed;
  }

  return getPublicUrl(bucketName, trimmed.replace(/^\//, ""));
}
