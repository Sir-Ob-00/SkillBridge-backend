import { Role } from '@prisma/client';
import { authorize } from './authorize';

/** Allows only admin or super_admin roles. */
export const adminOnly = authorize([Role.admin, Role.super_admin]);
