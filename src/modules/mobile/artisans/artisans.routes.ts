import { Router } from 'express';
import { artisansController } from './artisans.controller';
import { onboardingRouter } from '../onboarding/onboarding.routes';
import { listReviewsQuerySchema } from '../../reviews/reviews.validators';
import { requireAuth, optionalAuth } from '../../../middlewares/requireAuth';
import { requireRole, requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { requireActiveArtisan } from '../../../middlewares/requireActiveArtisan';
import {
  upsertArtisanProfileSchema,
  addPortfolioItemSchema,
  listArtisansQuerySchema,
  artisanIdParamSchema,
  portfolioItemParamSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  approveArtisanSchema,
  rejectArtisanSchema,
  requestChangesSchema,
} from './artisans.validators';

const router = Router();

router.use('/me/onboarding', onboardingRouter);

router.get('/me/profile', requireAuth, requireRole(['artisan']), artisansController.getMyProfile);
router.get('/me/revenue', requireAuth, requireRole(['artisan']), artisansController.getMyRevenue);
router.patch(
  '/me/profile',
  requireAuth,
  requireRole(['artisan']),
  validate(upsertArtisanProfileSchema),
  artisansController.upsertMyProfile
);
router.post(
  '/me/portfolio',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(addPortfolioItemSchema),
  artisansController.addPortfolioItem
);

router.get('/', optionalAuth, validate(listArtisansQuerySchema, 'query'), artisansController.list);
router.get('/:id', validate(artisanIdParamSchema, 'params'), artisansController.getById);
router.get('/:id/services', validate(artisanIdParamSchema, 'params'), artisansController.listServices);
router.get('/:id/availability', validate(artisanIdParamSchema, 'params'), artisansController.getAvailability);
router.get('/:id/reviews', validate(artisanIdParamSchema, 'params'), validate(listReviewsQuerySchema, 'query'), artisansController.listReviews);
router.get('/:id/revenue', validate(artisanIdParamSchema, 'params'), artisansController.getRevenue);

router.delete(
  '/:id/portfolio/:itemId',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(portfolioItemParamSchema, 'params'),
  artisansController.removePortfolioItem
);

router.post(
  '/:id/services',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(artisanIdParamSchema, 'params'),
  validate(createServiceSchema),
  artisansController.createService
);
router.patch(
  '/:id/services/:serviceId',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(artisanIdParamSchema, 'params'),
  validate(serviceIdParamSchema, 'params'),
  validate(updateServiceSchema),
  artisansController.updateService
);
router.delete(
  '/:id/services/:serviceId',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(artisanIdParamSchema, 'params'),
  validate(serviceIdParamSchema, 'params'),
  artisansController.deleteService
);

router.put(
  '/:id/availability',
  requireAuth,
  requireRole(['artisan']),
  requireActiveArtisan,
  validate(artisanIdParamSchema, 'params'),
  validate(upsertArtisanProfileSchema),
  artisansController.updateAvailability
);

router.post('/:id/verify', requireAuth, requireAdmin, validate(artisanIdParamSchema, 'params'), artisansController.verify);
router.post('/:id/reject', requireAuth, requireAdmin, validate(artisanIdParamSchema, 'params'), artisansController.reject);
router.post('/:id/suspend', requireAuth, requireAdmin, validate(artisanIdParamSchema, 'params'), artisansController.suspend);
router.post('/:id/unsuspend', requireAuth, requireAdmin, validate(artisanIdParamSchema, 'params'), artisansController.unsuspend);

router.post(
  '/:id/approve',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  validate(approveArtisanSchema),
  artisansController.approve
);
router.post(
  '/:id/reject',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  validate(rejectArtisanSchema),
  artisansController.rejectApplication
);
router.post(
  '/:id/request-changes',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  validate(requestChangesSchema),
  artisansController.requestChanges
);

export const artisansRouter = router;
