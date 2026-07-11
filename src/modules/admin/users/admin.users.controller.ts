import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminUsersService } from './admin.users.service';
import { studentsAdminService } from './students/students.admin.service';
import { artisansAdminService } from './artisans/artisans.admin.service';
import { administratorsAdminService } from './administrators/administrators.admin.service';
import { ListAdminUsersQuery, UserIdParam, CreateAdminInput, AdminStatusInput, AdminUpdateUserInput } from './admin.users.validators';
import {
  listAdminUsersQuerySchema,
  userIdParamSchema,
  createAdminSchema,
  adminStatusSchema,
  adminUpdateUserSchema,
} from './admin.users.validators';
import { validate } from '../../../middlewares/validate';
import { authorize } from '../../../middlewares/authorize';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { notifyUser } from '../../../utils/notify';

export const adminUsersController = {
  list: [
    validate(listAdminUsersQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const { items, meta } = await adminUsersService.list(req.query as unknown as ListAdminUsersQuery);
      return sendPaginated(res, items, meta);
    }),
  ],

  listStudents: [
    validate(listAdminUsersQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const { items, meta } = await studentsAdminService.listStudents(req.query as unknown as ListAdminUsersQuery);
      return sendPaginated(res, items, meta);
    }),
  ],

  listArtisans: [
    validate(listAdminUsersQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const { items, meta } = await artisansAdminService.listArtisans(req.query as unknown as ListAdminUsersQuery);
      return sendPaginated(res, items, meta);
    }),
  ],

  listAdministrators: [
    validate(listAdminUsersQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const { items, meta } = await administratorsAdminService.listAdministrators(req.query as unknown as ListAdminUsersQuery);
      return sendPaginated(res, items, meta);
    }),
  ],

  getById: [
    validate(userIdParamSchema, 'params'),
    asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
      const user = await adminUsersService.getById(req.params.id);
      return sendSuccess(res, user);
    }),
  ],

  createAdmin: [
    authorize(['super_admin']),
    validate(createAdminSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const user = await adminUsersService.createAdmin(req.body as CreateAdminInput);
      await recordAudit({
        adminId: req.user.id,
        action: 'CREATE',
        resource: 'admin',
        resourceId: user.id,
        ipAddress: getClientIp(req),
        newValue: { email: user.email, role: user.role },
      });
      return sendSuccess(res, user, 'Admin created successfully.', 201);
    }),
  ],

  update: [
    validate(userIdParamSchema, 'params'),
    validate(adminUpdateUserSchema),
    asyncHandler(async (req: Request<UserIdParam, unknown, AdminUpdateUserInput>, res: Response) => {
      const user = await adminUsersService.update(req.params.id, req.body);
      await recordAudit({
        adminId: req.user?.id,
        action: 'UPDATE',
        resource: 'user',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, user, 'User updated successfully.');
    }),
  ],

  updateStatus: [
    validate(userIdParamSchema, 'params'),
    validate(adminStatusSchema),
    asyncHandler(async (req: Request<UserIdParam, unknown, AdminStatusInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const user = await adminUsersService.updateStatus(req.params.id, req.body.isSuspended);
      await recordAudit({
        adminId: req.user.id,
        action: req.body.isSuspended ? 'SUSPEND' : 'UNSUSPEND',
        resource: 'user',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { isSuspended: req.body.isSuspended },
      });
      if (req.body.isSuspended) {
        await notifyUser(req.params.id, 'Account suspended', 'Your account has been suspended by an administrator.');
      } else {
        await notifyUser(req.params.id, 'Account restored', 'Your account has been reactivated.');
      }
      return sendSuccess(res, user, 'User status updated.');
    }),
  ],

  remove: [
    validate(userIdParamSchema, 'params'),
    asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const result = await adminUsersService.remove(req.params.id, req.user.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'DELETE',
        resource: 'user',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, null, result.message);
    }),
  ],
};
