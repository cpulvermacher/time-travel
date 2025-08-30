import { getSettingsStorage } from './browser'

export type SettingName = 'stopClock' | 'autoReload' | 'advancedSettingsOpen' | 'timezone' | 'recentTimezones'

export async function saveSetting<T>(key: SettingName, value: T): Promise<void> {
    try {
        await getSettingsStorage()?.set({ [key]: value })
    } catch (error) {
        // this shouldn't be fatal (there are rate limits on this)
        console.error('Error saving setting:', error)
    }
}

/** load a setting */
export async function loadSetting<T>(key: SettingName, defaultValue: T): Promise<T> {
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

/** save most recent timezone to 'recentTimezones' history */
export async function saveMostRecentTimezone(timezone: string) {
    const maxHistory = 5
    let timezones = await loadSetting<string[]>('recentTimezones', [])

    timezones.unshift(timezone)
    //remove duplicates
    timezones = timezones.filter((tz, index) => timezones.indexOf(tz) === index)
    timezones = timezones.slice(0, maxHistory)

    await saveSetting('recentTimezones', timezones)
}
