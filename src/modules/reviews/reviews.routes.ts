import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole, requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import { createReviewSchema, reviewIdParamSchema } from './reviews.validators';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(['student']),
  validate(createReviewSchema),
  reviewsController.create
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(reviewIdParamSchema, 'params'),
  reviewsController.remove
);

router.post(
  '/:id/flag',
  requireAuth,
  requireAdmin,
  validate(reviewIdParamSchema, 'params'),
  reviewsController.flag
);

export const reviewsRouter = router;
