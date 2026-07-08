import { Role } from '@prisma/client';
import { authorize } from './authorize';

/** Allows only the student role. */
export const studentOnly = authorize([Role.student]);
