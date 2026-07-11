import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { UpdateSettingsInput } from './admin.settings.validators';

export const adminSettingsService = {
  async getSettings() {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings) {
      return {
        appName: 'SkillBridge',
        supportEmail: 'support@skillbridge.dev',
        maintenanceMode: false,
        allowNewRegistrations: true,
        bookingLeadTimeHours: 24,
        maxBookingsPerDay: 5,
        notifyOnNewReport: true,
        notifyOnNewBooking: true,
        featuredArtisanIds: [],
      };
    }
    return settings;
  },

  async updateSettings(input: UpdateSettingsInput) {
    const existing = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!existing) {
      const created = await prisma.systemSettings.create({
        data: {
          id: 'singleton',
          appName: input.appName ?? 'SkillBridge',
          supportEmail: input.supportEmail ?? 'support@skillbridge.dev',
          maintenanceMode: input.maintenanceMode ?? false,
          allowNewRegistrations: input.allowNewRegistrations ?? true,
          bookingLeadTimeHours: input.bookingLeadTimeHours ?? 24,
          maxBookingsPerDay: input.maxBookingsPerDay ?? 5,
          notifyOnNewReport: input.notifyOnNewReport ?? true,
          notifyOnNewBooking: input.notifyOnNewBooking ?? true,
          featuredArtisanIds: input.featuredArtisanIds ?? [],
        },
      });
      return created;
    }

    return prisma.systemSettings.update({
      where: { id: 'singleton' },
      data: {
        ...(input.appName !== undefined ? { appName: input.appName } : {}),
        ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
        ...(input.maintenanceMode !== undefined ? { maintenanceMode: input.maintenanceMode } : {}),
        ...(input.allowNewRegistrations !== undefined ? { allowNewRegistrations: input.allowNewRegistrations } : {}),
        ...(input.bookingLeadTimeHours !== undefined ? { bookingLeadTimeHours: input.bookingLeadTimeHours } : {}),
        ...(input.maxBookingsPerDay !== undefined ? { maxBookingsPerDay: input.maxBookingsPerDay } : {}),
        ...(input.notifyOnNewReport !== undefined ? { notifyOnNewReport: input.notifyOnNewReport } : {}),
        ...(input.notifyOnNewBooking !== undefined ? { notifyOnNewBooking: input.notifyOnNewBooking } : {}),
        ...(input.featuredArtisanIds !== undefined ? { featuredArtisanIds: input.featuredArtisanIds } : {}),
      },
    });
  },
};
