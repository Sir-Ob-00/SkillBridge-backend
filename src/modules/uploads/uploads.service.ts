import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

interface UploadToCloudinaryOptions {
  buffer: Buffer;
  folder: string;
}

export const uploadToCloudinary = async ({ buffer, folder }: UploadToCloudinaryOptions): Promise<string> => {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload failed'));
        resolve(result);
      }
    );
    stream.end(buffer);
  });

  return result.secure_url;
};

export const uploadsService = {
  async uploadImage(buffer: Buffer, folder: string) {
    try {
      const url = await uploadToCloudinary({ buffer, folder });
      return url;
    } catch (error) {
      throw ApiError.internal('Image upload failed.');
    }
  },
};
