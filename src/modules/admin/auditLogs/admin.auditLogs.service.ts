/**
 * Audit log capture is not yet wired into the request lifecycle, so this
 * returns an empty list. A persistent `AuditLog` model + middleware can be
 * added later to record admin actions (login, user/booking/category changes).
 */
export const adminAuditLogsService = {
  async list(): Promise<unknown[]> {
    return [];
  },
};
