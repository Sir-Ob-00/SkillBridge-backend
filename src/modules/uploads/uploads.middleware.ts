import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../../utils/ApiError';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, next: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return next(ApiError.badRequest('Only JPEG, PNG, and WebP images are allowed.') as any);
  }
  next(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const requireSingleImage = (fieldName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      throw ApiError.badRequest('Image file is required.');
    }
    (req as any).uploadedFile = req.file;
    next();
  };
};
