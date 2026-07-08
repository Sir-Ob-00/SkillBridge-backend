import { reportsService } from '../../reports/reports.service';

export const adminReportsService = {
  list(query: Parameters<typeof reportsService.list>[0]) {
    return reportsService.list(query);
  },
  updateStatus(id: string, status: Parameters<typeof reportsService.updateStatus>[1]) {
    return reportsService.updateStatus(id, status);
  },
};
