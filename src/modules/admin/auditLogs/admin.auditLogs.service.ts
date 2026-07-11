import { prisma } from '../../../config/prisma';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { recordAudit } from '../../../utils/audit';
import { ListAuditLogsQuery } from './admin.auditLogs.validators';

export const adminAuditLogsService = {
  async list(query: ListAuditLogsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: Record<string, unknown> = {};
    if (query.resource) where.resource = query.resource;
    if (query.action) where.action = query.action;
    if (query.adminId) where.adminId = query.adminId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) (where.createdAt as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.createdAt as Record<string, unknown>).lte = new Date(query.to);
    }

    const [items, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async getById(id: string) {
    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) {
      return null;
    }
    return log;
  },

  async export() {
    return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
  },

  /** Programmatic helper used by other admin modules to record actions. */
  record: recordAudit,
};
