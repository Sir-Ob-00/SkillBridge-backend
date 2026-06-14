import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  categoryIdParamSchema,
} from './categories.validators';

const router = Router();

router.get('/', validate(listCategoriesQuerySchema, 'query'), categoriesController.list);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(createCategorySchema),
  categoriesController.create
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  categoriesController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(categoryIdParamSchema, 'params'),
  categoriesController.remove
);

export const categoriesRouter = router;
