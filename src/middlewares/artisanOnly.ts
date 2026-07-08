import { Role } from '@prisma/client';
import { authorize } from './authorize';

/** Allows only the artisan role. */
export const artisanOnly = authorize([Role.artisan]);
