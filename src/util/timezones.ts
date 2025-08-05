import { m } from '../paraglide/messages'

export type Timezone = {
    tz: string // IANA timezone identifier, e.g., "America/New_York". Empty string for browser default.
    label: string // label, e.g. 'America/New_York (GMT-05:00)'
    group?: string // grouping label, e.g. 'America'
}

let timezoneOptions: Timezone[] | null = null

/* returns the full list of supported browser time zones.
 *
 * (Assumes locale does not change during the lifetime of the extension)
 */
export function getTimezoneOptions(locale: string): Timezone[] {
    if (timezoneOptions) {
        return timezoneOptions
    }

    try {
        if ('supportedValuesOf' in Intl) {
            const timeZones = Intl.supportedValuesOf('timeZone')

            timezoneOptions = [
                {
                    tz: '',
                    label: `${m.timezone_browser_default()} - ${getTimezoneName(locale, undefined)} (${getOffset(locale, undefined)})`,
                },
                { tz: 'UTC', label: 'GMT' },
                ...timeZones
                    .filter((tz) => tz !== 'UTC') // Remove UTC as it's already added
                    .map((tz) => {
                        const offset = getOffset(locale, tz)
                        const tzParts = tz.split('/')
                        const group = tzParts.length > 1 ? tzParts[0] : 'Etc' // Firefox has a number of funky timezones like 'CST6CDT', put them in 'Etc'
                        const tzName = tzParts.length > 1 ? tzParts[1] : tz

                        return {
                            tz,
                            label: `${tzName}\t(${offset})`,
                            group,
                        }
                    })
                    .sort((a, b) => a.tz.localeCompare(b.tz)), // Sort by timezone identifier
            ]
        }
    } catch (error) {
        console.error('Error loading timezones:', error)
        timezoneOptions = [{ tz: '', label: m.timezone_browser_default() }]
    }
    return timezoneOptions!
}

/**  Get offset in localized format like "GMT-08:00" */
function getOffset(locale: string, tz: string | undefined) {
    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        timeZoneName: 'longOffset',
    })
    return formatter.format(new Date()).split(' ').pop() || ''
}

/** Get timezone name */
function getTimezoneName(locale: string, tz: string | undefined) {
    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        timeZoneName: 'shortGeneric',
    })
    return formatter.format(new Date()).split(' ').pop() || ''
}
