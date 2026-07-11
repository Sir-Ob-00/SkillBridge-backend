import { Router } from 'express';
import { adminArtisansController } from './artisans.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminArtisansController.list as any);
router.get('/statistics', adminArtisansController.statistics);
router.get('/export', adminArtisansController.export);
router.get('/:id', adminArtisansController.getById as any);
router.get('/:id/services', adminArtisansController.services as any);
router.get('/:id/portfolio', adminArtisansController.portfolio as any);
router.get('/:id/availability', adminArtisansController.availability as any);
router.patch('/:id', adminArtisansController.update as any);
router.patch('/:id/status', adminArtisansController.setStatus as any);
router.patch('/:id/suspend', adminArtisansController.suspend as any);
router.patch('/:id/unsuspend', adminArtisansController.unsuspend as any);
router.delete('/:id', adminArtisansController.remove as any);

export const adminArtisansRouter = router;
