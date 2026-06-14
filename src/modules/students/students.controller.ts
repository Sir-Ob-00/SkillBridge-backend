import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { studentsService } from './students.service';
import { SaveArtisanInput, ArtisanIdParam } from './students.validators';

export const studentsController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await studentsService.getProfile(req.user.id);
    return sendSuccess(res, profile);
  }),

  listSaved: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const saved = await studentsService.listSavedArtisans(req.user.id);
    return sendSuccess(res, saved);
  }),

  save: asyncHandler(async (req: Request<unknown, unknown, SaveArtisanInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await studentsService.saveArtisan(req.user.id, req.body.artisanId);
    return sendSuccess(res, null, result.message, 201);
  }),

  unsave: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await studentsService.unsaveArtisan(req.user.id, req.params.artisanId);
    return sendSuccess(res, null, result.message);
  }),

  bookingHistory: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const bookings = await studentsService.getBookingHistory(req.user.id);
    return sendSuccess(res, bookings);
  }),
};
