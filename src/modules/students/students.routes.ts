import { Router } from 'express';
import { studentsController } from './students.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import { saveArtisanSchema, artisanIdParamSchema } from './students.validators';

const router = Router();

router.use(requireAuth, requireRole(['student']));

router.get('/me/profile', studentsController.getProfile);
router.get('/me/saved-artisans', studentsController.listSaved);
router.post('/me/saved-artisans', validate(saveArtisanSchema), studentsController.save);
router.delete(
  '/me/saved-artisans/:artisanId',
  validate(artisanIdParamSchema, 'params'),
  studentsController.unsave
);
router.get('/me/bookings', studentsController.bookingHistory);

export const studentsRouter = router;
