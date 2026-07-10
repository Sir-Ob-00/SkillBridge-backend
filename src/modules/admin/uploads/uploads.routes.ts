import { Router } from 'express';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', (_req, res) => res.json({ message: 'Uploads endpoint - implement file handling here' }));

export const uploadsRouter = router;
