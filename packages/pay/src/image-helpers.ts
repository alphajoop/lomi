import {
  optimizeImage as optimizeImageShared,
  processStorageUrl,
  type OptimizeImageResize,
} from "@lomi./shared";

export type ImageStorageClient = {
  storage: {
    from: (bucket: string) => {
      getPublicUrl: (path: string) => { data?: { publicUrl?: string } };
    };
  };
};

export function createImageHelpers(
  supabase: ImageStorageClient,
  transformsEnabled: boolean,
) {
  const getPublicUrl = (bucket: string, path: string) =>
    supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl;

  return {
    optimizeImage: (
      url: string | null | undefined,
      width: number,
      height?: number,
      resize: OptimizeImageResize = "cover",
    ) => optimizeImageShared(url, width, height, resize, transformsEnabled),
    processLogoUrl: (logoUrl: string | null) =>
      processStorageUrl(logoUrl, "logos", getPublicUrl),
    processAvatarUrl: (avatarUrl: string | null) =>
      processStorageUrl(avatarUrl, "avatars", getPublicUrl),
  };
}
