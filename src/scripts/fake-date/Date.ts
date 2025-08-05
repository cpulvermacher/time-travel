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
function patchDateMethods(datePrototype: Date): void {
    // --- Override string representation methods ---

    datePrototype.toString = function () {
        const dateString = this.toDateString()
        const timeString = this.toTimeString()
        if (dateString === 'Invalid Date' || timeString === 'Invalid Date') {
            return 'Invalid Date'
        }

        return `${dateString} ${timeString}`
    }
    datePrototype.toDateString = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return 'Invalid Date'
        }

        const monthLabel = shortMonths[parts.month] || parts.month

        return `${parts.weekday} ${monthLabel} ${parts.rawFormat.day} ${parts.rawFormat.year}`
    }
    datePrototype.toTimeString = function () {
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
        const raw = parts.rawFormat

        return `${raw.hour}:${raw.minute}:${raw.second} ${offset} (${tzName})`
    }

    // Override locale string methods to use the selected timezone when no timezone is specified
    datePrototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return OriginalDate.prototype.toLocaleString.call(this, locales, options)
    }

    datePrototype.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return OriginalDate.prototype.toLocaleDateString.call(this, locales, options)
    }

    datePrototype.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!options || !options.timeZone) {
            const timezone = getTimezone()
            if (timezone) {
                options = { ...(options || {}), timeZone: timezone }
            }
        }
        return OriginalDate.prototype.toLocaleTimeString.call(this, locales, options)
    }

    // --- Override local time methods to return values in the selected timezone ---

    datePrototype.getHours = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.hour
    }

    datePrototype.getMinutes = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.minute
    }

    datePrototype.getSeconds = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.second
    }

    datePrototype.getMilliseconds = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.ms
    }

    datePrototype.getDate = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.day
    }

    datePrototype.getMonth = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.month
    }

    datePrototype.getFullYear = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.year
    }

    datePrototype.getDay = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        // Convert weekday name to number (0-6, Sunday-Saturday)
        return weekdays.indexOf(parts.weekday || 'Sun')
    }

    datePrototype.getTimezoneOffset = function () {
        const timezone = getTimezone()
        const parts = formatToPartsWithTimezone(this, timezone)
        if (!parts) {
            return NaN
        }

        return getOffsetFromLongOffset(parts.timeZoneName)
    }

    // --- Override local time setters to use selected timezone ---

    datePrototype.setFullYear = function (...args: [year: number, month?: number, date?: number]) {
        const timezone = getTimezone()
        if (!timezone) {
            // calling the native method with (1, undefined) will create an invalid date, need to pass correct number of arguments
            return OriginalDate.prototype.setFullYear.apply(this, args)
        }

        const [year, month, date] = args
        return overridePartOfDate(this, timezone, { year, month, day: date })
    }

    datePrototype.setMonth = function (...args: [month: number, date?: number]) {
        const timezone = getTimezone()
        if (!timezone) {
            // calling the native method with (1, undefined) will create an invalid date, need to pass correct number of arguments
            return OriginalDate.prototype.setMonth.apply(this, args)
        }

        const [month, date] = args
        return overridePartOfDate(this, timezone, { month, day: date })
    }

    datePrototype.setDate = function (date: number) {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.setDate.call(this, date)
        }

        return overridePartOfDate(this, timezone, { day: date })
    }

    datePrototype.setHours = function (...args: [hours: number, min?: number, sec?: number, ms?: number]) {
        const timezone = getTimezone()
        if (!timezone) {
            // calling the native method with (1, undefined) will create an invalid date, need to pass correct number of arguments
            return OriginalDate.prototype.setHours.apply(this, args)
        }

        const [hours, min, sec, ms] = args
        return overridePartOfDate(this, timezone, { hours, minutes: min, seconds: sec, milliseconds: ms })
    }

    datePrototype.setMinutes = function (minutes: number) {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.setMinutes.call(this, minutes)
        }
        // Note: setMinutes() only accepts minutes, not seconds or milliseconds

        return overridePartOfDate(this, timezone, { minutes })
    }

    // Note: We don't override UTC methods as they should remain as is
    // likewise, setSeconds/setMiliseconds are not affected by timezone
}

/**
 * Overides parts of `date` in a similar way that setHours() etc. do,
 * but does so in the given timezone.
 * After calling this, with `{ hours: 14 }`, `FakeDate.getHour(date)` is expected to return 14.
 *
 * @returns timestamp of the date after setting, or NaN if invalid
 */
function overridePartOfDate(
    date: Date,
    timezone: string,
    override: {
        year?: number
        month?: number // 0-based, e.g. 0 for January
        day?: number // 1-based, e.g. 1 for the first day of the month
        hours?: number
        minutes?: number
        seconds?: number
        milliseconds?: number
    }
) {
    const parts = formatToPartsWithTimezone(date, timezone)
    if (!parts) {
        return date.setTime(NaN)
    }

    // parse local time as UTC, e.g. 12:00:00 GMT+03:00 will be 12:00:00Z
    // this ignores ambiguous dates!
    const utcTimestamp = Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second, parts.ms)

    let year = override.year ?? parts.year
    let month = override.month ?? parts.month
    let day = override.day ?? parts.day
    let hours = override.hours ?? parts.hour
    let minutes = override.minutes ?? parts.minute
    let seconds = override.seconds ?? parts.second
    let ms = override.milliseconds ?? parts.ms

    // parse overrides using UTC setters.
    // this handles overflows/underflows, so hours=-1 will create a date 1h before utcDate
    const utcOverride = new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms))

    const newDate = new Date(date.getTime() + (utcOverride.getTime() - utcTimestamp))

    // check if offset is different
    const oldOffset = date.getTimezoneOffset()
    const newOffset = newDate.getTimezoneOffset()
    if (oldOffset !== newOffset) {
        newDate.setTime(newDate.getTime() - (oldOffset - newOffset) * 60 * 1000)
    }

    return date.setTime(newDate.getTime())
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

function formatToPartsWithTimezone(date: Date, timezone: string | undefined): DateParts | undefined {
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
patchDateMethods(FakeDate.prototype as Date)
