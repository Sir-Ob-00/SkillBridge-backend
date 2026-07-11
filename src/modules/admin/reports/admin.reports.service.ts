import { ReportStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { reportsService } from '../../reports/reports.service';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';

const REPORT_INCLUDE = {
  reporter: { select: { id: true, name: true, email: true, role: true } },
  target: { select: { id: true, name: true, email: true, role: true } },
};

export const adminReportsService = {
  async list(query: Parameters<typeof reportsService.list>[0]) {
    const result = await reportsService.list(query);
    return result;
  },

  async statistics() {
    const [total, open, resolved, escalated] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.open } }),
      prisma.report.count({ where: { status: ReportStatus.resolved } }),
      prisma.report.count({ where: { status: ReportStatus.escalated } }),
    ]);
    return { total, open, resolved, escalated };
  },

  async export() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: REPORT_INCLUDE,
    });
  },

  async getById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: REPORT_INCLUDE,
    });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }
    return report;
  },

  async updateStatus(id: string, status: ReportStatus) {
    return reportsService.updateStatus(id, status);
  },

  async assign(id: string, adminId: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }
    return prisma.report.update({
      where: { id },
      data: { assignedTo: adminId },
      include: REPORT_INCLUDE,
    });
  },

  async resolve(id: string, adminId: string, resolution?: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }
    return prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.resolved,
        assignedTo: adminId,
        resolution: resolution ?? null,
        closedAt: new Date(),
      },
      include: REPORT_INCLUDE,
    });
  },

  async dismiss(id: string, adminId: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }
    return prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.resolved,
        assignedTo: adminId,
        closedAt: new Date(),
      },
      include: REPORT_INCLUDE,
    });
  },

  async addNote(id: string, note: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw ApiError.notFound('Report not found.');
    }
    return prisma.report.update({
      where: { id },
      data: { details: note },
      include: REPORT_INCLUDE,
    });
  },
};
