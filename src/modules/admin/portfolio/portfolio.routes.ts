import { Router } from 'express';
import { portfolioController } from './portfolio.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { portfolioIdParamSchema, listPortfoliosQuerySchema } from './portfolio.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listPortfoliosQuerySchema, 'query'), portfolioController.list);
router.delete('/:id', validate(portfolioIdParamSchema, 'params'), portfolioController.remove);

export const portfolioRouter = router;
