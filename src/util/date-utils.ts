export type FormatOptions = {
    fullPrecision: boolean
}

/** Returns date in format "YYYY-MM-DD hh:mm" in local time, or "Invalid Date" if invalid
 *
 * If options.fullPrecision is true, returns seconds and milliseconds if they are non-zero
 */
export function formatLocalDate(date: Date, options?: FormatOptions): string {
    if (isNaN(date.getTime())) {
        return 'Invalid Date'
    }

    // negative years (=before 1BCE) need to be padded with extra digits for Date() to parse them
    const yyyy =
        date.getFullYear() >= 0
            ? String(date.getFullYear()).padStart(4, '0')
            : '-' + String(-date.getFullYear()).padStart(6, '0')
    let dateStr =
        yyyy +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0') +
        ' ' +
        String(date.getHours()).padStart(2, '0') +
        ':' +
        String(date.getMinutes()).padStart(2, '0')

    if (options?.fullPrecision) {
        if (date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
            dateStr += ':' + String(date.getSeconds()).padStart(2, '0')
        }
        if (date.getMilliseconds() !== 0) {
            dateStr += '.' + String(date.getMilliseconds()).padStart(3, '0')
        }
    }
    return dateStr
}

/** Returns a date string in format "YYYY-MM-DD hh:mm..." using the date from `newDate`, and the time from `dateTimeString`.
 *
 * Precision of time part is preserved, but includes at least hours and minutes.
 * `newDate` is interpreted as local time, and the returned string will be in local time.
 */
export function overwriteDatePart(dateTimeString: string, newDate: Date): string {
    const parsedDateTime = parseDate(dateTimeString)
    const timeRegex = /\d{1,2}:\d{1,2}/
    if (parsedDateTime === null || !timeRegex.test(parsedDateTime)) {
        newDate.setHours(0)
        newDate.setMinutes(0)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        return formatLocalDate(newDate)
    }

    const timePart = new Date(parsedDateTime)
    newDate.setHours(timePart.getHours())
    newDate.setMinutes(timePart.getMinutes())
    newDate.setSeconds(timePart.getSeconds())
    newDate.setMilliseconds(timePart.getMilliseconds())

    return formatLocalDate(newDate, { fullPrecision: true })
}

/** Tries parsing a date string, returns a valid date string or null if invalid.
 *
 * If the string is a UNIX timestamp, it is converted into an ISO string instead.
 * Empty strings are returned as is.
 */
export function parseDate(date: string): string | null {
    try {
        if (date && Number.isInteger(+date)) {
            date = new Date(Number.parseInt(date)).toISOString()
        }
        if (date && isNaN(Date.parse(date))) {
            return null
        }
        return date
    } catch {
        return null
    }
}
