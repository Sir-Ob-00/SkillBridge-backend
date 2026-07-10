import { Router } from 'express';
import { categoriesController, categoryIdParamSchema } from './categories.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';

const createCategorySchema = z.object({ name: z.string().trim().min(1), active: z.boolean().optional() });
const updateCategorySchema = z.object({ name: z.string().trim().min(1).optional(), active: z.boolean().optional() });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', categoriesController.list);
router.post('/', validate(createCategorySchema), categoriesController.create);
router.patch('/:id', validate(categoryIdParamSchema, 'params'), validate(updateCategorySchema), categoriesController.update);
router.delete('/:id', validate(categoryIdParamSchema, 'params'), categoriesController.remove);

export const adminCategoriesRouter = router;
