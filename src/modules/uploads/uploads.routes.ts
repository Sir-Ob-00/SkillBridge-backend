import { Router } from 'express';
import { uploadsController } from './uploads.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireEmailVerified } from '../../middlewares/requireEmailVerified';
import { validate } from '../../middlewares/validate';
import { upload, requireSingleImage } from './uploads.middleware';
import { z } from 'zod';

const router = Router();

const uploadQuerySchema = z.object({
  folder: z.string().trim().max(100).optional(),
});

router.post(
  '/image',
  requireAuth,
  requireEmailVerified,
  upload.single('image'),
  requireSingleImage('image'),
  validate(uploadQuerySchema, 'query'),
  uploadsController.uploadImage
);

export const uploadsPublicRouter = router;
