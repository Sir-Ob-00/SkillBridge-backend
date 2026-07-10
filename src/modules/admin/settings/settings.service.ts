export const settingsService = {
  async get() {
    return {
      platformName: 'SkillBridge',
      supportEmail: 'support@skillbridge.dev',
      maintenanceMode: false,
    };
  },

  async update(data: Record<string, any>) {
    return {
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },
};
