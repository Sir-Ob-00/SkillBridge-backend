import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminArtisansService } from './artisans.service';
import {
  ListArtisansQuery,
  UpdateArtisanInput,
  ArtisanStatusInput,
} from './artisans.validators';
import {
  listArtisansQuerySchema,
  updateArtisanSchema,
  artisanStatusSchema,
  artisanIdParamSchema,
} from './artisans.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { notifyUser } from '../../../utils/notify';

const artisanUserId = (profile: any): string | undefined => profile?.user?.id ?? profile?.userId;

export const adminArtisansController = {
  list: [
    validate(listArtisansQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminArtisansService.list(req.query as unknown as ListArtisansQuery);
      return sendSuccess(res, result);
    }),
  ],

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminArtisansService.statistics();
    return sendSuccess(res, stats);
  }),

  export: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await adminArtisansService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="artisans.json"');
    return res.status(200).json({ success: true, data: rows });
  }),

  getById: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const artisan = await adminArtisansService.getById(req.params.id);
      return sendSuccess(res, artisan);
    }),
  ],

  services: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const services = await adminArtisansService.getServices(req.params.id);
      return sendSuccess(res, services);
    }),
  ],

  portfolio: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await adminArtisansService.getPortfolio(req.params.id);
      return sendSuccess(res, portfolio);
    }),
  ],

  availability: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const availability = await adminArtisansService.getAvailability(req.params.id);
      return sendSuccess(res, availability);
    }),
  ],

  update: [
    validate(artisanIdParamSchema, 'params'),
    validate(updateArtisanSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminArtisansService.update(req.params.id, req.body);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'artisan',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, updated, 'Artisan updated successfully.');
    }),
  ],

  setStatus: [
    validate(artisanIdParamSchema, 'params'),
    validate(artisanStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminArtisansService.setStatus(req.params.id, req.body);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE_STATUS',
        resource: 'artisan',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, updated, 'Artisan status updated.');
    }),
  ],

  suspend: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminArtisansService.suspend(req.params.id, true);
      const userId = artisanUserId(updated);
      if (userId) {
        await notifyUser(userId, 'Account suspended', 'Your artisan account has been suspended by an administrator.');
      }
      await recordAudit({
        adminId: req.user.id,
        action: 'SUSPEND',
        resource: 'artisan',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, updated, 'Artisan suspended.');
    }),
  ],

  unsuspend: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminArtisansService.suspend(req.params.id, false);
      const userId = artisanUserId(updated);
      if (userId) {
        await notifyUser(userId, 'Account restored', 'Your artisan account has been reactivated.');
      }
      await recordAudit({
        adminId: req.user.id,
        action: 'UNSUSPEND',
        resource: 'artisan',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, updated, 'Artisan unsuspended.');
    }),
  ],

  remove: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const result = await adminArtisansService.remove(req.params.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'DELETE',
        resource: 'artisan',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, result, result.message);
    }),
  ],
};
