import { getSettingsStorage } from './browser';

type SettingName = keyof Settings;

export type Settings = {
    autoReload: boolean;
    stopClock: boolean; // tab state if time travel is active, stored setting if inactive
    advancedSettingsOpen: boolean;
    timezone: string; // '' for browser default timezone
    recentTimezones: string[]; // last `maxTimezoneHistory` timezone IDs
};

const defaultSettings: Settings = {
    autoReload: false,
    stopClock: false,
    advancedSettingsOpen: false,
    timezone: '',
    recentTimezones: [],
};

const maxTimezoneHistory = 5;

export async function saveSetting<T>(key: SettingName, value: T): Promise<void> {
    try {
        await getSettingsStorage()?.set({ [key]: value });
    } catch (error) {
        // this shouldn't be fatal (there are rate limits on this)
        console.error('Error saving setting:', error);
    }
}

/** save most recent timezone to 'recentTimezones' history */
export async function saveMostRecentTimezone(timezone: string) {
    let timezones = await loadSetting('recentTimezones', []);

    timezones.unshift(timezone);
    //remove duplicates
    timezones = timezones.filter((tz, index) => timezones.indexOf(tz) === index);
    timezones = timezones.slice(0, maxTimezoneHistory);

    await saveSetting('recentTimezones', timezones);
}

/** load all settings */
export async function loadSettings(): Promise<Settings> {
    const storage = getSettingsStorage();
    if (!storage) {
        console.error('No settings storage available');
        return defaultSettings;
    }

    try {
        const settings = await storage.get<Settings>([
            'autoReload',
            'stopClock',
            'advancedSettingsOpen',
            'timezone',
            'recentTimezones',
        ]);
        return { ...defaultSettings, ...settings };
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    return defaultSettings;
}

/** load a single setting */
async function loadSetting<T extends keyof Settings>(key: T, defaultValue: Settings[T]): Promise<Settings[T]> {
    try {
        const result = await getSettingsStorage()?.get<Settings>([key]);
        if (result && key in result) {
            return result[key];
        } else {
            return defaultValue;
        }
    } catch (error) {
        console.error('Error loading setting:', error);
        return defaultValue;
    }
}
