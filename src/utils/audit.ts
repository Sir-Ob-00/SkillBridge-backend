import type { Request } from 'express';
import { prisma } from '../config/prisma';

/**
 * Records an administrator action to the AuditLog table. Failures are swallowed
 * (logged) so audit logging never breaks the primary request flow.
 */
export const recordAudit = async (params: {
  adminId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
}): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        oldValue: (params.oldValue ?? undefined) as object | undefined,
        newValue: (params.newValue ?? undefined) as object | undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] failed to record log:', error);
  }
};

/** Extracts the best-effort client IP from a request. */
export const getClientIp = (req: Request): string | undefined => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress;
};
