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
