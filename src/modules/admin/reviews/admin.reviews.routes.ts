import { Router } from 'express';
import { adminReviewsController } from './admin.reviews.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listReviewsQuerySchema,
  reviewIdParamSchema,
} from '../../reviews/reviews.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get(
  '/',
  validate(listReviewsQuerySchema, 'query'),
  adminReviewsController.list as any
);
router.get('/statistics', adminReviewsController.statistics);
router.get('/export', adminReviewsController.export);
router.get(
  '/:id',
  validate(reviewIdParamSchema, 'params'),
  adminReviewsController.getById as any
);
router.patch(
  '/:id/hide',
  validate(reviewIdParamSchema, 'params'),
  adminReviewsController.hide as any
);
router.patch(
  '/:id/restore',
  validate(reviewIdParamSchema, 'params'),
  adminReviewsController.restore as any
);
router.patch(
  '/:id/flag',
  validate(reviewIdParamSchema, 'params'),
  adminReviewsController.flag as any
);
router.delete(
  '/:id',
  validate(reviewIdParamSchema, 'params'),
  adminReviewsController.remove as any
);

export const adminReviewsRouter = router;
