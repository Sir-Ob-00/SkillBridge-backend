// Backwards-compatible aliases. The canonical implementation now lives in
// `authorize.ts`. Mobile modules continue to import `requireRole` /
// `requireAdmin`, so existing authorization logic is unchanged.
import { Role } from '@prisma/client';
import { authorize } from './authorize';

export { authorize as requireRole };
export const requireAdmin = authorize([Role.admin, Role.super_admin]);
