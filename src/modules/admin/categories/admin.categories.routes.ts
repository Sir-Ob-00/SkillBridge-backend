import { Router } from 'express';
import { adminCategoriesController } from './admin.categories.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listCategoriesQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from '../../categories/categories.validators';
import { categoryStatusSchema, reorderCategoriesSchema } from './admin.categories.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listCategoriesQuerySchema, 'query'), adminCategoriesController.list as any);
router.get('/statistics', adminCategoriesController.statistics);
router.get('/:id', validate(categoryIdParamSchema, 'params'), adminCategoriesController.getById as any);
router.post('/', validate(createCategorySchema), adminCategoriesController.create as any);
router.patch('/:id', validate(categoryIdParamSchema, 'params'), validate(updateCategorySchema), adminCategoriesController.update as any);
router.patch('/:id/status', validate(categoryIdParamSchema, 'params'), validate(categoryStatusSchema), adminCategoriesController.setStatus as any);
router.patch('/reorder', validate(reorderCategoriesSchema), adminCategoriesController.reorder as any);
router.delete('/:id', validate(categoryIdParamSchema, 'params'), adminCategoriesController.remove as any);

export const adminCategoriesRouter = router;
