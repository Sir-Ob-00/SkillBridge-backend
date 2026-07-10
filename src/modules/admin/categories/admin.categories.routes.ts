import { Router } from 'express';
import { adminCategoriesController } from './admin.categories.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  categoryIdParamSchema,
} from '../../categories/categories.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listCategoriesQuerySchema, 'query'), adminCategoriesController.list);
router.post('/', validate(createCategorySchema), adminCategoriesController.create);
router.patch(
  '/:id',
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  adminCategoriesController.update
);
router.delete('/:id', validate(categoryIdParamSchema, 'params'), adminCategoriesController.remove);

export const adminCategoriesRouter = router;
