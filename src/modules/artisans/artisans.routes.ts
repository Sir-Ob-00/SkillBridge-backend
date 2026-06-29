import { Router } from 'express';
import { artisansController } from './artisans.controller';
import { listReviewsQuerySchema } from '../reviews/reviews.validators';
import { requireAuth, optionalAuth } from '../../middlewares/requireAuth';
import { requireRole, requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  upsertArtisanProfileSchema,
  addPortfolioItemSchema,
  listArtisansQuerySchema,
  artisanIdParamSchema,
  portfolioItemParamSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  updateAvailabilitySchema,
} from './artisans.validators';
import { imageUpload } from './upload';

const router = Router();

// ── Self-management (artisan role) — must precede /:id ─────────────────
router.get(
  '/me/profile',
  requireAuth,
  requireRole(['artisan']),
  artisansController.getMyProfile
);
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
  imageUpload.single('image'),
  validate(addPortfolioItemSchema),
  artisansController.addPortfolioItem
);

router.post(
  '/me/profile-image',
  requireAuth,
  requireRole(['artisan']),
  imageUpload.single('image'),
  artisansController.updateProfileImage
);

// ── Public listing ───────────────────────────────────────────────────
router.get('/', optionalAuth, validate(listArtisansQuerySchema, 'query'), artisansController.list);
router.get('/:id', validate(artisanIdParamSchema, 'params'), artisansController.getById);
router.get(
  '/:id/services',
  validate(artisanIdParamSchema, 'params'),
  artisansController.listServices
);
router.get(
  '/:id/portfolio',
  validate(artisanIdParamSchema, 'params'),
  artisansController.getPortfolio
);
router.get(
  '/:id/availability',
  validate(artisanIdParamSchema, 'params'),
  artisansController.getAvailability
);
router.get(
  '/:id/reviews',
  validate(artisanIdParamSchema, 'params'),
  validate(listReviewsQuerySchema, 'query'),
  artisansController.listReviews
);

// ── Artisan-managed sub-resources ──────────────────────────────────────
router.delete(
  '/:id/portfolio/:itemId',
  requireAuth,
  requireRole(['artisan']),
  validate(portfolioItemParamSchema, 'params'),
  artisansController.removePortfolioItem
);

router.post(
  '/:id/services',
  requireAuth,
  requireRole(['artisan']),
  validate(artisanIdParamSchema, 'params'),
  validate(createServiceSchema),
  artisansController.createService
);
router.patch(
  '/:id/services/:serviceId',
  requireAuth,
  requireRole(['artisan']),
  validate(serviceIdParamSchema, 'params'),
  validate(updateServiceSchema),
  artisansController.updateService
);
router.delete(
  '/:id/services/:serviceId',
  requireAuth,
  requireRole(['artisan']),
  validate(serviceIdParamSchema, 'params'),
  artisansController.deleteService
);

router.put(
  '/:id/availability',
  requireAuth,
  requireRole(['artisan']),
  validate(artisanIdParamSchema, 'params'),
  validate(updateAvailabilitySchema),
  artisansController.updateAvailability
);

// ── Admin moderation ───────────────────────────────────────────────────
router.post(
  '/:id/verify',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  artisansController.verify
);
router.post(
  '/:id/reject',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  artisansController.reject
);
router.post(
  '/:id/suspend',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  artisansController.suspend
);
router.post(
  '/:id/unsuspend',
  requireAuth,
  requireAdmin,
  validate(artisanIdParamSchema, 'params'),
  artisansController.unsuspend
);

export const artisansRouter = router;
