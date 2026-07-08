import { z } from 'zod';

export const updateSettingsSchema = z.object({
  appName: z.string().trim().min(2).max(120).optional(),
  supportEmail: z.string().trim().toLowerCase().email().optional(),
  maintenanceMode: z.boolean().optional(),
  allowNewRegistrations: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
