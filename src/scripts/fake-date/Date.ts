import {
    compareDateParts,
    getDateParts,
    getDatePartsForLocalDate,
    getDatePartsForLocalTimestamp,
    getTimezoneName,
    type LocalDateParts,
} from '../../util/date-parts'
import { optionsWithDefaultTz } from './DateTimeFormat'
import { fakeNowDate, getTimezone } from './storage'

const OriginalDate = Date

const msPerSecond = 1000
const msPerMinute = 60 * msPerSecond
const msPerHour = 60 * msPerMinute
const msPerDay = 24 * msPerHour

// Date constructor, needs to be a function to allow both constructing (`new Date()`) and calling without new: `Date()`
export function FakeDate(
    ...args: [
        yearOrDate?: string | number | Date,
        month?: number,
        date?: number,
        hours?: number,
        min?: number,
        sec?: number,
        ms?: number,
    ]
) {
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
    } else if (args.length > 1 && typeof args[0] === 'number') {
        const [year, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0, ms = 0] = args

        const desiredLocalDate = getDatePartsForLocalDate(year, month, day, hours, minutes, seconds, ms)
        const timestamp = disambiguateDate(desiredLocalDate, timezone)
        returnDate = new OriginalDate(timestamp)
    } else {
        // @ts-expect-error: let original Date constructor handle the arguments
        returnDate = new OriginalDate(...args)
    }

    // for `new SomeClassDerivedFromDate()`, make sure we return something that is an instance of SomeClassDerivedFromDate
    Object.setPrototypeOf(returnDate, new.target.prototype as object)

    return returnDate
}

/** Patch Date methods to respect the selected timezone */
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
        if (!timezone) {
            return OriginalDate.prototype.toDateString.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return 'Invalid Date'
        }

        const monthLabel = shortMonths[parts.month] || parts.month

        return `${parts.weekday} ${monthLabel} ${parts.rawFormat.day} ${parts.rawFormat.year}`
    }
    datePrototype.toTimeString = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.toTimeString.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return 'Invalid Date'
        }

        let offset = parts.offsetName.replace(':', '')
        if (offset === 'GMT') {
            offset = 'GMT+0000'
        }
        const tzName = getTimezoneName(this, timezone)
        const raw = parts.rawFormat

        return `${raw.hour}:${raw.minute}:${raw.second} ${offset} (${tzName})`
    }

    // Override locale string methods to use the configured timezone by default
    datePrototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        return OriginalDate.prototype.toLocaleString.call(this, locales, optionsWithDefaultTz(options))
    }

    datePrototype.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        return OriginalDate.prototype.toLocaleDateString.call(this, locales, optionsWithDefaultTz(options))
    }

    datePrototype.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        return OriginalDate.prototype.toLocaleTimeString.call(this, locales, optionsWithDefaultTz(options))
    }

    // --- Override local time methods to return values in the configured timezone ---

    datePrototype.getFullYear = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getFullYear.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.year
    }

    // add deprecated getYear() if the underlying Date implements it
    if (datePrototype.getYear !== undefined) {
        datePrototype.getYear = function () {
            return this.getFullYear() - 1900
        }
    }

    datePrototype.getMonth = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getMonth.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.month
    }

    datePrototype.getDate = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getDate.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.day
    }

    datePrototype.getDay = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getDay.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        // Convert weekday name to number (0-6, Sunday-Saturday)
        return weekdays.indexOf(parts.weekday || 'Sun')
    }

    datePrototype.getHours = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getHours.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.hour
    }

    datePrototype.getMinutes = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getMinutes.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.minute
    }

    datePrototype.getSeconds = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getSeconds.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.second
    }

    datePrototype.getMilliseconds = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getMilliseconds.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return parts.ms
    }

    datePrototype.getTimezoneOffset = function () {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.getTimezoneOffset.call(this)
        }

        const parts = getDateParts(this, timezone)
        if (!parts) {
            return NaN
        }

        return getOffsetFromLongOffset(parts.offsetName)
    }

    // --- Override local time setters to use configured timezone ---

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

    datePrototype.setMinutes = function (...args: [min: number, sec?: number, ms?: number]) {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.setMinutes.apply(this, args)
        }

        const [min, sec, ms] = args
        return overridePartOfDate(this, timezone, { minutes: min, seconds: sec, milliseconds: ms })
    }

    datePrototype.setSeconds = function (...args: [sec: number, ms?: number]) {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.setSeconds.apply(this, args)
        }

        const [sec, ms] = args
        return overridePartOfDate(this, timezone, { seconds: sec, milliseconds: ms })
    }

    datePrototype.setMilliseconds = function (ms: number) {
        const timezone = getTimezone()
        if (!timezone) {
            return OriginalDate.prototype.setMilliseconds.call(this, ms)
        }

        return overridePartOfDate(this, timezone, { milliseconds: ms })
    }

    // Note: We don't override UTC methods as they should remain as is
}

/** for a given date and timezone, returns a single UTC timestamp that produces the desiredDate.
 *
 * In case there is a transition between two timezone offsets (e.g. DST change) that results
 * in two possible matching timestamps, we choose the timestamp before the transition.
 *
 * Implementation similar to temporal-polyfill's GetNamedTimeZoneEpochNanoseconds()
 */
function disambiguateDate(desiredDate: LocalDateParts, timezone: string): number {
    // create an initial UTC timestamp based on any offset somewhere within 24h
    const timestamp =
        desiredDate.localTimestamp + new Date(desiredDate.localTimestamp).getTimezoneOffset() * msPerMinute
    const oneDayBefore = new Date(timestamp - msPerDay)
    const oneDayAfter = new Date(timestamp + msPerDay)

    const offsetBefore = oneDayBefore.getTimezoneOffset()
    const offsetAfter = oneDayAfter.getTimezoneOffset()
    // if offsets are the same, there is no transition, we can return the timestamp directly
    if (offsetBefore === offsetAfter) {
        return timestamp
    }

    //if offsets differ, there was a transition => check whether each candidate produces the desired local date
    const candidateTimestamps = [
        desiredDate.localTimestamp + offsetBefore * msPerMinute,
        desiredDate.localTimestamp + offsetAfter * msPerMinute,
    ]
    const validTimestamps = candidateTimestamps.filter((ts) => {
        const candidateDate = getDateParts(ts, timezone)
        return compareDateParts(candidateDate, desiredDate)
    })
    if (validTimestamps.length > 0) {
        return validTimestamps[0] // return the first valid timestamp (= before transition)
    }

    //there may not be a valid timestamp, e.g. if the desired local date is skipped due to a DST change
    //in that case return the timestamp as is
    return timestamp
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
    const parts = getDateParts(date, timezone)
    if (!parts) {
        return date.setTime(NaN)
    }

    const year = override.year ?? parts.year
    const month = override.month ?? parts.month
    const day = override.day ?? parts.day
    const hours = override.hours ?? parts.hour
    const minutes = override.minutes ?? parts.minute
    const seconds = override.seconds ?? parts.second
    const ms = override.milliseconds ?? parts.ms

    const desiredLocalDate = getDatePartsForLocalDate(year, month, day, hours, minutes, seconds, ms)
    return date.setTime(disambiguateDate(desiredLocalDate, timezone))
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

/**
 * parses a date string into a timestamp.
 * For all cases where Date.parse() would parse the string as local time, uses the provided timezone.
 *
 * This is a bit tricky because timezone is a IANA ID like Europe/London, but parse() only supports timezone offsets
 */
function parseWithTimezone(dateString: string, timezone: string | undefined): number {
    if (!timezone) {
        return OriginalDate.parse(dateString)
    }

    // check for timezone offset - time specifier (\d:) followed by Z, +\d, -\d
    const hasOffset = /\d:.*(?:Z|[+-]\d)/i.test(dateString.trim())

    // check if this is date only (e.g. "2025-07-15") => Needs to be parsed as UTC
    const isDateOnly = !dateString.includes(':')

    if (hasOffset || isDateOnly) {
        return OriginalDate.parse(dateString)
    }

    const trimmedDateString = dateString.replace(/\s*\([^)]+\)\s*$/, '').trim()
    const parsedAsUTC = OriginalDate.parse(`${trimmedDateString}Z`)

    const desiredLocalDate = getDatePartsForLocalTimestamp(parsedAsUTC)
    return disambiguateDate(desiredLocalDate, timezone)
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
