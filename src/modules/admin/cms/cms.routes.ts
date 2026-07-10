import { Router } from 'express';
import { cmsController } from './cms.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listCmsQuerySchema, cmsIdParamSchema } from './cms.controller';
import { z } from 'zod';

const createCmsSchema = z.object({ title: z.string().trim().min(1), body: z.string().trim().min(1), type: z.string().trim().optional() });
const updateCmsSchema = z.object({ title: z.string().trim().min(1).optional(), body: z.string().trim().min(1).optional(), type: z.string().trim().optional() });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listCmsQuerySchema, 'query'), cmsController.list);
router.post('/', validate(createCmsSchema), cmsController.create);
router.patch('/:id', validate(cmsIdParamSchema, 'params'), validate(updateCmsSchema), cmsController.update);
router.delete('/:id', validate(cmsIdParamSchema, 'params'), cmsController.remove);

export const cmsRouter = router;
