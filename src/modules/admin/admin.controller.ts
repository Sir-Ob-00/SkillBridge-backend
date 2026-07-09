import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { adminService } from './admin.service';
import { ApproveArtisanInput, RejectArtisanInput, RequestChangesInput, ArtisanIdParam, ListPendingQuery } from './admin.validators';

type ApproveBody = Request<ArtisanIdParam, unknown, ApproveArtisanInput>;
type RejectBody = Request<ArtisanIdParam, unknown, RejectArtisanInput>;
type ChangesBody = Request<ArtisanIdParam, unknown, RequestChangesInput>;
type PendingQuery = Request<unknown, unknown, unknown, ListPendingQuery>;

export const adminController = {
  approve: asyncHandler(async (req: ApproveBody, res: Response) => {
    const profile = await adminService.approve(req.params.id, req.user!.id, req.body.notes ?? undefined);
    return sendSuccess(res, profile, 'Artisan application approved.');
  }),

  reject: asyncHandler(async (req: RejectBody, res: Response) => {
    const profile = await adminService.reject(req.params.id, req.user!.id, req.body.reason);
    return sendSuccess(res, profile, 'Artisan application rejected.');
  }),

  requestChanges: asyncHandler(async (req: ChangesBody, res: Response) => {
    const profile = await adminService.requestChanges(req.params.id, req.user!.id, req.body.changes);
    return sendSuccess(res, profile, 'Changes requested from artisan.');
  }),

  listPending: asyncHandler(async (req: PendingQuery, res: Response) => {
    const { items, meta } = await adminService.listPending(req.query);
    return sendPaginated(res, items, meta);
  }),
};
