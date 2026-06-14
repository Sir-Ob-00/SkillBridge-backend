import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { usersService } from './users.service';
import { UpdateProfileInput, ListUsersQuery, UserIdParam } from './users.validators';

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await usersService.getById(req.user.id);
    return sendSuccess(res, user);
  }),

  updateMe: asyncHandler(async (req: Request<unknown, unknown, UpdateProfileInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await usersService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, user, 'Profile updated successfully.');
  }),

  getById: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const user = await usersService.getById(req.params.id);
    return sendSuccess(res, user);
  }),

  list: asyncHandler(async (req: Request<unknown, unknown, unknown, ListUsersQuery>, res: Response) => {
    const { items, meta } = await usersService.listUsers(req.query);
    return sendPaginated(res, items, meta);
  }),

  suspend: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const user = await usersService.suspendUser(req.params.id, true);
    return sendSuccess(res, user, 'User suspended.');
  }),

  unsuspend: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const user = await usersService.suspendUser(req.params.id, false);
    return sendSuccess(res, user, 'User reinstated.');
  }),

  remove: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const result = await usersService.deleteUser(req.params.id);
    return sendSuccess(res, null, result.message);
  }),
};
