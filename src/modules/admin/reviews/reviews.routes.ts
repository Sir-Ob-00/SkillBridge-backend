import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { reviewIdParamSchema, listReviewsQuerySchema } from './reviews.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listReviewsQuerySchema, 'query'), reviewsController.list);
router.delete('/:id', validate(reviewIdParamSchema, 'params'), reviewsController.delete);
router.patch('/:id/flag', validate(reviewIdParamSchema, 'params'), reviewsController.flag);

export const adminReviewsRouter = router;
