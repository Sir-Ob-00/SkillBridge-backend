// Shared, app-wide TypeScript types. The Express `Request.user` augmentation
// lives in `middlewares/authenticate.ts`; re-export the type here for
// convenient access across modules.
export type { AuthenticatedUser } from '../middlewares/authenticate';
