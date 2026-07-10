export const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface ImageUploadResult {
  publicUrl: string;
  secureUrl: string;
  filename: string;
}

export const normalizeImageUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Image URL must be a valid HTTP(S) URL');
  }
  return url;
};
