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
                    .filter((tz) => tz !== 'UTC')
                    .map((tz) => {
                        const offset = getOffset(locale, tz)
                        const tzParts = tz.split('/')
                        const group = tzParts.length > 1 ? tzParts[0] : 'Etc' // Firefox has a number of funky timezones like 'CST6CDT', put them in 'Etc'
                        const tzName = tzParts.length > 1 ? tzParts.slice(1).join('/') : tz

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
    return removeDateTimePart(formatter.format(new Date()))
}

/** Get timezone name */
function getTimezoneName(locale: string, tz: string | undefined) {
    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        timeZoneName: 'shortGeneric',
    })
    return removeDateTimePart(formatter.format(new Date()))
}

/** Remove date and time part from a string, leaving only the timezone part. */
function removeDateTimePart(str: string): string {
    const parts = str.split(' ')
    if (parts.length > 1) {
        return parts.slice(1).join(' ')
    }
    return str
}

export function isDst(dateStr: string, timezone: string): boolean {
    const date = new Date(dateStr)
    const summerDate = new Date(date.getFullYear(), 5, 1) // June 1st
    const winterDate = new Date(date.getFullYear(), 11, 1) // December 1st

    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        timeZoneName: 'longOffset',
    }
    const formatter = new Intl.DateTimeFormat('en', options)
    const offsetSummer = formatter.formatToParts(summerDate).find((part) => part.type === 'timeZoneName')?.value
    const offsetWinter = formatter.formatToParts(winterDate).find((part) => part.type === 'timeZoneName')?.value
    if (!offsetSummer || !offsetWinter || offsetSummer === offsetWinter) {
        return false // timezone does not observe DST
    }
    const offsetDate = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')?.value
    if (!offsetDate) {
        return false
    }

    // DST can happen in 'winter' in the southern hemisphere, so we check if the date's offset is later than either offset
    if (offsetDate > offsetWinter || offsetDate > offsetSummer) {
        return true
    }
    return false
}
