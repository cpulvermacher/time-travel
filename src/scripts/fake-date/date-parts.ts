type DateParts = {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
    ms: number
    weekday: string
    timeZoneName: string
    rawFormat: Record<Intl.DateTimeFormatPartTypes, string>
}

export function getDateParts(date: Date | number, timezone: string | undefined): DateParts | undefined {
    const formatter = getFormatterForTimezone(timezone)
    try {
        const parts = formatter.formatToParts(date)
        const partsMap = {} as Record<Intl.DateTimeFormatPartTypes, string>
        parts.forEach((part) => {
            partsMap[part.type] = part.value
        })
        return {
            year: parseInt(partsMap.year, 10),
            // Month is 1-based in formatToParts but 0-based in Date methods
            month: parseInt(partsMap.month, 10) - 1,
            day: parseInt(partsMap.day, 10),
            hour: parseInt(partsMap.hour, 10),
            minute: parseInt(partsMap.minute, 10),
            second: parseInt(partsMap.second, 10),
            ms: parseInt(partsMap.fractionalSecond, 10),
            weekday: partsMap.weekday,
            timeZoneName: partsMap.timeZoneName,
            rawFormat: partsMap,
        }
    } catch {
        return undefined
    }
}

/** Gets a cached formatter */
function getFormatterForTimezone(timezone: string | undefined): Intl.DateTimeFormat {
    if (cachedFormatterForTimezone === timezone && cachedFormatter !== null) {
        return cachedFormatter
    }
    cachedFormatterForTimezone = timezone
    cachedFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false,
        hourCycle: 'h23',
        weekday: 'short',
        timeZoneName: 'longOffset',
        timeZone: timezone,
    })
    return cachedFormatter
}

let cachedFormatter: Intl.DateTimeFormat | null = null
let cachedFormatterForTimezone: string | undefined | null = null
