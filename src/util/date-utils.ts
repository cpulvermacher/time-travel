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
    if (!parsedDateTime.isValid || !timeRegex.test(dateTimeString)) {
        newDate.setHours(0)
        newDate.setMinutes(0)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        return formatLocalDate(newDate)
    }

    const timePart = parsedDateTime.date
    newDate.setHours(timePart.getHours())
    newDate.setMinutes(timePart.getMinutes())
    newDate.setSeconds(timePart.getSeconds())
    newDate.setMilliseconds(timePart.getMilliseconds())

    return formatLocalDate(newDate, { fullPrecision: true })
}

export type ParsedDate = ValidDate | InvalidDate | ResetDate
export type ValidDate = {
    dateString: string // unmodified input string
    date: Date
    isValid: true
    isReset: false
}
export type InvalidDate = {
    dateString: string // unmodified input string
    isValid: false
    isReset: false
}
export type ResetDate = {
    dateString: string // unmodified input string
    isValid: false
    isReset: true
}

/** Tries parsing a date string */
export function parseDate(dateString: string): ParsedDate {
    if (dateString.trim() === '') {
        return { dateString, isValid: false, isReset: true }
    }

    try {
        let date
        if (Number.isInteger(+dateString)) {
            date = new Date(Number.parseInt(dateString))
        } else {
            date = new Date(dateString)
        }
        if (isNaN(date.getTime())) {
            return { dateString, isValid: false, isReset: false }
        }
        return { dateString, date, isValid: true, isReset: false }
    } catch {
        return { dateString, isValid: false, isReset: false }
    }
}
