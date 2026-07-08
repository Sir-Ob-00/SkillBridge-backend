import { Router } from 'express';
import { adminReviewsController } from './admin.reviews.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { reviewIdParamSchema } from '../../reviews/reviews.validators';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', adminReviewsController.list);
router.delete('/:id', validate(reviewIdParamSchema, 'params'), adminReviewsController.remove);

export const adminReviewsRouter = router;
