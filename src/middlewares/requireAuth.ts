// Backwards-compatible aliases. The canonical implementations now live in
// `authenticate.ts` / `authorize.ts`. Mobile modules continue to import
// `requireAuth` / `requireRole`, so existing authorization logic is unchanged.
export { authenticate as requireAuth, optionalAuth } from './authenticate';
