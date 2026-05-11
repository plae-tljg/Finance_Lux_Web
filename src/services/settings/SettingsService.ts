export interface Settings {
  language: 'zh' | 'en';
  currency: string;
  dateFormat: string;
  startOfWeek: 'sunday' | 'monday';
  compactMode: boolean;
  showPet: boolean;
  showParticles: boolean;
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
  lastBackupDate: string | null;
}

export const defaultSettings: Settings = {
  language: 'zh',
  currency: '¥',
  dateFormat: 'YYYY-MM-DD',
  startOfWeek: 'monday',
  compactMode: false,
  showPet: true,
  showParticles: true,
  autoBackup: false,
  backupInterval: 'weekly',
  lastBackupDate: null,
};

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem('luxury_finance_settings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('luxury_finance_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}