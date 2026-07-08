import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminUsersService } from './admin.users.service';
import { studentsAdminService } from './students/students.admin.service';
import { artisansAdminService } from './artisans/artisans.admin.service';
import { administratorsAdminService } from './administrators/administrators.admin.service';
import {
  AdminUpdateUserInput,
  ListAdminUsersQuery,
  UserIdParam,
} from './admin.users.validators';

export const adminUsersController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListAdminUsersQuery>, res: Response) => {
      const { items, meta } = await adminUsersService.list(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  listStudents: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListAdminUsersQuery>, res: Response) => {
      const { items, meta } = await studentsAdminService.listStudents(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  listArtisans: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListAdminUsersQuery>, res: Response) => {
      const { items, meta } = await artisansAdminService.listArtisans(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  listAdministrators: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListAdminUsersQuery>, res: Response) => {
      const { items, meta } = await administratorsAdminService.listAdministrators(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  getById: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const user = await adminUsersService.getById(req.params.id);
    return sendSuccess(res, user);
  }),

  update: asyncHandler(
    async (req: Request<UserIdParam, unknown, AdminUpdateUserInput>, res: Response) => {
      const user = await adminUsersService.update(req.params.id, req.body);
      return sendSuccess(res, user, 'User updated successfully.');
    }
  ),

  remove: asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await adminUsersService.remove(req.params.id, req.user.id);
    return sendSuccess(res, null, result.message);
  }),
};
