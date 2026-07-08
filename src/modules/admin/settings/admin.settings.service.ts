import { UpdateSettingsInput } from './admin.settings.validators';

export interface SystemSettings {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
}

/**
 * System settings are held in-memory. A persistent `Setting` model + migration
 * can be added later when durable storage is required.
 */
const settings: SystemSettings = {
  appName: 'SkillBridge',
  supportEmail: 'support@skillbridge.dev',
  maintenanceMode: false,
  allowNewRegistrations: true,
};

export const adminSettingsService = {
  getSettings(): SystemSettings {
    return { ...settings };
  },

  updateSettings(input: UpdateSettingsInput): SystemSettings {
    if (input.appName !== undefined) settings.appName = input.appName;
    if (input.supportEmail !== undefined) settings.supportEmail = input.supportEmail;
    if (input.maintenanceMode !== undefined) settings.maintenanceMode = input.maintenanceMode;
    if (input.allowNewRegistrations !== undefined)
      settings.allowNewRegistrations = input.allowNewRegistrations;

    return { ...settings };
  },
};
