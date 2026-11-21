import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cloudinaryUrl } from "@/lib/images";
import { mediaApi } from "../api";

export const MAX_UPLOAD_MB = 5;
export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif";

export function useMediaList(folder?: string, page = 1) {
  return useQuery({ queryKey: ["admin", "media", folder ?? "all", page], queryFn: () => mediaApi.list(folder, page) });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folder, alt }: { file: File; folder: string; alt: string }) => {
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        return Promise.reject(new Error(`"${file.name}" is larger than ${MAX_UPLOAD_MB} MB.`));
      }
      if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
        return Promise.reject(new Error(`"${file.name}" isn't a JPG, PNG, WebP or AVIF image.`));
      }
      return mediaApi.upload(file, folder, alt);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media"] }),
  });
}

/** Cloudinary delivery URL resized for thumbnails (other URLs are returned unchanged). */
export function thumb(url: string, width = 400) {
  return cloudinaryUrl(url, width);
}

export function formatBytes(bytes?: number) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
