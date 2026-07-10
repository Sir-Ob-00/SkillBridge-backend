import { Router } from 'express';
import { adminPortfolioController } from './admin.portfolio.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { portfolioItemIdParamSchema } from './admin.portfolio.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminPortfolioController.list);
router.delete(
  '/:id',
  validate(portfolioItemIdParamSchema, 'params'),
  adminPortfolioController.remove
);

export const adminPortfoliosRouter = router;
