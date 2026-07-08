import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', dashboardController.getDashboard);

export const dashboardRouter = router;
