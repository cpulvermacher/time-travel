import { fakeNowDate, getTimezone } from './storage'

const OriginalDate = Date

// Date constructor, needs to be a function to allow both constructing (`new Date()`) and calling without new: `Date()`
export function FakeDate(...args: unknown[]) {
    if (!new.target) {
        // `Date()` invoked without 'new', return current time string
        return new Date().toString()
    }

    if (args.length === 0) {
        args = [fakeNowDate()]
    }

    let returnDate: Date
    const timezone = getTimezone()
    if (!timezone || (args.length === 1 && (typeof args[0] === 'number' || args[0] instanceof OriginalDate))) {
        // @ts-expect-error: let original Date constructor handle the arguments
        returnDate = new OriginalDate(...args)
    } else if (args.length === 1 && typeof args[0] === 'string') {
        returnDate = new OriginalDate(parseWithTimezone(args[0], timezone))
    } else if (args.length > 1) {
        const dateTimeString = buildDateTimeString(args)
        returnDate = new OriginalDate(parseWithTimezone(dateTimeString, timezone))
    } else {
        // @ts-expect-error: let original Date constructor handle the arguments
        returnDate = new OriginalDate(...args)
    }

    patchDateMethods(returnDate)

    // for `new SomeClassDerivedFromDate()`, make sure we return something that is an instance of SomeClassDerivedFromDate
    Object.setPrototypeOf(returnDate, new.target.prototype as object)

    return returnDate
}

/** build a string in the format of "YYYY-MM-DD HH:mm:ss.sss" */
function buildDateTimeString(args: unknown[]) {
    let year = args[0] as number
    if (year >= 0 && year <= 99) {
        year += 1900 // 2-digit years are interpreted as 1900-1999 as per spec
    }
    const month = (args[1] as number) + 1
    const date = (args[2] as number) || 1
    const hours = (args[3] as number) || 0
    const minutes = (args[4] as number) || 0
    const seconds = (args[5] as number) || 0
    const milliseconds = (args[6] as number) || 0

    //TODO spec has fun underflow/overflow rules, e.g. if month is 13, it will be interpreted as January of the next year
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`

    return `${dateString} ${timeString}`
}

/**
 * Patch Date methods to respect the selected timezone
 * This includes:
 * - String representation methods: toString, toLocaleString, toLocaleDateString, toLocaleTimeString
 * - Local time methods: getHours, getMinutes, getSeconds, etc.
 * - UTC methods (getUTCHours, etc.) remain unaffected
 */
function patchDateMethods(dateObj: Date): void {
    // Store original methods to be used later
    const originalToLocaleString = dateObj.toLocaleString.bind(dateObj)
    const originalToLocaleDateString = dateObj.toLocaleDateString.bind(dateObj)
    const originalToLocaleTimeString = dateObj.toLocaleTimeString.bind(dateObj)

    // --- Override string representation methods ---
    //TODO I should probably use bind() instead of directly assigning the function
    // but then again this might only be an Intl. thing

    // Override toString to use the selected timezone
    dateObj.toString = function () {
        const dateString = this.toDateString()
        const timeString = this.toTimeString()
        if (dateString === 'Invalid Date' || timeString === 'Invalid Date') {
            return 'Invalid Date'
        }

        return `${dateString} ${timeString}`
    }
    dateObj.toDateString = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return 'Invalid Date'
        }

        const monthLabel = shortMonths[parseInt(parts.month, 10) - 1] || parts.month

        return `${parts.weekday} ${monthLabel} ${parts.day} ${parts.year}`
    }
    dateObj.toTimeString = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return 'Invalid Date'
        }

        let offset = parts.timeZoneName.replace(':', '')
        if (offset === 'GMT') {
            offset = 'GMT+0000'
        }
        const tzName = getTimezoneName(this, timezone)

        return `${parts.hour}:${parts.minute}:${parts.second} ${offset} (${tzName})`
    }

    // Override locale string methods to use the selected timezone when no timezone is specified
    dateObj.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return originalToLocaleString(locales, options)
    }

    dateObj.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return originalToLocaleDateString(locales, options)
    }

    dateObj.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return originalToLocaleTimeString(locales, options)
    }

    // --- Override local time methods to return values in the selected timezone ---

    dateObj.getHours = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.hour ? parseInt(parts.hour, 10) : 0
    }

    dateObj.getMinutes = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.minute ? parseInt(parts.minute, 10) : 0
    }

    dateObj.getSeconds = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.second ? parseInt(parts.second, 10) : 0
    }

    dateObj.getMilliseconds = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.fractionalSecond ? parseInt(parts.fractionalSecond, 10) : 0
    }

    dateObj.getDate = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.day ? parseInt(parts.day, 10) : 1
    }

    dateObj.getMonth = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        // Month is 1-based in formatToParts but 0-based in Date methods
        return parts.month ? parseInt(parts.month, 10) - 1 : 0
    }

    dateObj.getFullYear = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.year ? parseInt(parts.year, 10) : 0
    }

    dateObj.getDay = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        // Convert weekday name to number (0-6, Sunday-Saturday)
        return weekdays.indexOf(parts.weekday || 'Sun')
    }

    dateObj.getTimezoneOffset = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return getOffsetFromLongOffset(parts.timeZoneName)
    }

    // Note: We don't override UTC methods as they should remain as is
}

/** Gets timezone offset in minutes from a longOffset string.
 *
 * Example: "GMT+02:00" -> -120
 */
function getOffsetFromLongOffset(longOffset?: string): number {
    if (!longOffset) {
        return 0
    }
    const match = longOffset.match(/GMT([+-]\d{2}):(\d{2})/)
    if (match) {
        const hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        if (hours < 0) {
            return -(hours * 60 - minutes)
        } else {
            return -(hours * 60 + minutes)
        }
    }
    return 0
}

function formatToPartsWithTimezone(
    date: Date,
    timezone: string | undefined
): Record<Intl.DateTimeFormatPartTypes, string> | undefined {
    const formatter = getFormatterForTimezone(timezone)
    try {
        const parts = formatter.formatToParts(date)
        const partsMap = {} as Record<Intl.DateTimeFormatPartTypes, string>
        parts.forEach((part) => {
            partsMap[part.type] = part.value
        })
        return partsMap
    } catch {
        return undefined
    }
}

/** Returns timezone name for toString()/toTimeString(). */
function getTimezoneName(date: Date, timezone: string | undefined): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'long', // technically the format is implementation defined, but Chrome, Firefox and node seem to follow this
        timeZone: timezone,
    })

    try {
        const parts = formatter.formatToParts(date)
        const timeZonePart = parts.find((part) => part.type === 'timeZoneName')
        return timeZonePart ? timeZonePart.value : ''
    } catch {
        return ''
    }
}

/**
 * parses a date string into a timestamp.
 * For all cases where Date.parse() would parse the string as local time, uses the provided timezone.
 *
 * This is a bit tricky because timezone is a IANA ID like Europe/London, but parse() only supports timezone offsets
 */
function parseWithTimezone(dateString: string, timezone: string | undefined): number {
    // Check for common timezone patterns
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC|\b[A-Z]{3,4}\b)$/i.test(dateString.trim())

    // check if this is date only (e.g. "2025-07-15") => Needs to be parsed as UTC
    const isDateOnly = !dateString.includes(':')

    if (!timezone || hasTimezone || isDateOnly) {
        return OriginalDate.parse(dateString)
    }

    const trimmedDateString = dateString.replace(/\s*\([^)]+\)\s*$/, '').trim()
    const longOffset = getOffset(trimmedDateString, timezone)
    return OriginalDate.parse(`${trimmedDateString} ${longOffset}`)
}

/** Returns a long offset string like "GMT+02:00" for the given date string and timezone.
 *
 * @param dateString - a local date string (without TZ specifier), e.g. "2025-07-15 12:00:00" in the given timezone
 * @param timezone - a timezone IANA ID like "Europe/Berlin"
 * @returns a long offset string like "GMT+02:00"
 */
function getOffset(dateString: string, timezone: string): string | undefined {
    // first, use local time to parse `dateString`. the date is very likely wrong,
    // but we get a reasonable approximation of the timezone offset
    const approximateDate = new OriginalDate(dateString)
    const parts = formatToPartsWithTimezone(approximateDate, timezone)
    if (!parts) {
        return undefined
    }
    let offset = parts.timeZoneName

    // now parse the date string with the timezone offset
    const firstAttemptDate = new OriginalDate(`${dateString} ${offset}`)
    const refinedParts = formatToPartsWithTimezone(firstAttemptDate, timezone)

    // If the timezone offsets are different, we crossed a DST boundary
    if (refinedParts && refinedParts.timeZoneName !== parts.timeZoneName) {
        offset = refinedParts.timeZoneName
    }
    return offset
}

/** copy all own properties from source to target, except 'constructor'
 *
 * This includes both own properties and symbols, enumerable or not.
 */
function copyOwnProperties<T extends object>(source: T, target: T): void {
    Reflect.ownKeys(source)
        .filter((key) => key !== 'constructor')
        .forEach((key) => {
            target[key as keyof T] = source[key as keyof T]
        })
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

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// static properties
Object.setPrototypeOf(FakeDate, OriginalDate)
FakeDate.now = () => new Date().getTime()
FakeDate.parse = (datestr: string) => new Date(datestr).getTime()

// for instance properties, _copy_ them from the original Date prototype
// this is necessary for e.g. @date-fns/tz, which iterates over Object.getOwnPropertyNames(Date.prototype)
// see also https://github.com/cpulvermacher/time-travel/issues/41
copyOwnProperties(OriginalDate.prototype, FakeDate.prototype)
