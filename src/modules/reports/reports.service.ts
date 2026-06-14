import { ReportStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { emitToAdmins } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import { CreateReportInput, ListReportsQuery } from './reports.validators';

const REPORT_INCLUDE = {
  reporter: { select: { id: true, name: true, email: true, role: true } },
  target: { select: { id: true, name: true, email: true, role: true } },
} as const;

export const reportsService = {
  async create(reporterId: string, input: CreateReportInput) {
    if (reporterId === input.targetUserId) {
      throw ApiError.badRequest('You cannot report yourself.');
    }

    const target = await prisma.user.findUnique({ where: { id: input.targetUserId } });
    if (!target) {
      throw ApiError.notFound('Target user not found.');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetUserId: input.targetUserId,
        reason: input.reason,
        details: input.details,
      },
      include: REPORT_INCLUDE,
    });

    emitToAdmins(SOCKET_EVENTS.REPORT_SUBMITTED, report);

    return report;
  },

  async list(query: ListReportsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = query.status ? { status: query.status } : {};

    const [items, totalItems] = await Promise.all([
      prisma.report.findMany({
        where,
        include: REPORT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async updateStatus(id: string, status: ReportStatus) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }

    return prisma.report.update({
      where: { id },
      data: { status },
      include: REPORT_INCLUDE,
    });
  },
};
