import { z } from 'zod';

export const updateSettingsSchema = z.object({
  appName: z.string().trim().min(2).max(120).optional(),
  supportEmail: z.string().trim().toLowerCase().email().optional(),
  maintenanceMode: z.boolean().optional(),
  allowNewRegistrations: z.boolean().optional(),
  bookingLeadTimeHours: z.coerce.number().int().min(0).optional(),
  maxBookingsPerDay: z.coerce.number().int().min(1).optional(),
  notifyOnNewReport: z.boolean().optional(),
  notifyOnNewBooking: z.boolean().optional(),
  featuredArtisanIds: z.array(z.string().uuid()).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
