import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const uploadToCloudinary = async (filePath: string, folder: string): Promise<string> => {
  if (!cloudinary.config().cloud_name) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!cloudinary.config().cloud_name) {
    return;
  }
  await cloudinary.uploader.destroy(publicId);
};

export const getPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/v\d+\/(.+?)\.\w+$/);
  return match ? match[1] : null;
};
