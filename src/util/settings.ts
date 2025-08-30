import { getSettingsStorage } from './browser'

type SettingName = keyof Settings

export type Settings = {
    autoReload: boolean
    stopClock: boolean // tab state if time travel is active, stored setting if inactive
    advancedSettingsOpen: boolean
    timezone: string // '' for browser default timezone
    recentTimezones: string[] // last `maxTimezoneHistory` timezone IDs
}

const maxTimezoneHistory = 5

export async function saveSetting<T>(key: SettingName, value: T): Promise<void> {
    try {
        await getSettingsStorage()?.set({ [key]: value })
    } catch (error) {
        // this shouldn't be fatal (there are rate limits on this)
        console.error('Error saving setting:', error)
    }
}

export async function loadSettings(): Promise<Settings> {
    return {
        autoReload: await loadSetting('autoReload', false),
        stopClock: await loadSetting('stopClock', false),
        advancedSettingsOpen: await loadSetting('advancedSettingsOpen', false),
        timezone: await loadSetting('timezone', ''),
        recentTimezones: await loadSetting<string[]>('recentTimezones', []),
    }
}

/** save most recent timezone to 'recentTimezones' history */
export async function saveMostRecentTimezone(timezone: string) {
    let timezones = await loadSetting<string[]>('recentTimezones', [])

    timezones.unshift(timezone)
    //remove duplicates
    timezones = timezones.filter((tz, index) => timezones.indexOf(tz) === index)
    timezones = timezones.slice(0, maxTimezoneHistory)

    await saveSetting('recentTimezones', timezones)
}

/** load a setting */
async function loadSetting<T>(key: SettingName, defaultValue: T): Promise<T> {
    try {
        const result = await getSettingsStorage()?.get([key])
        if (result && key in result) {
            return result[key] as T
        } else {
            return defaultValue
        }
    } catch (error) {
        console.error('Error loading setting:', error)
        return defaultValue
    }
}
