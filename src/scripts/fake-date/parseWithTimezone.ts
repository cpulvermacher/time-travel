import { getDatePartsForLocalTimestamp } from './date-parts'
import { disambiguateDate } from './disambiguateDate'

const OriginalDate = Date

/**
 * parses a date string into a timestamp.
 * For all cases where Date.parse() would parse the string as local time, uses the provided timezone.
 *
 * This is a bit tricky because timezone is a IANA ID like Europe/London, but parse() only supports timezone offsets
 */
export function parseWithTimezone(dateString: string, timezone: string | undefined): number {
    if (!timezone || isUTCDate(dateString)) {
        return OriginalDate.parse(dateString)
    }

    // remove whitespace and anything in parentheses at the end, e.g. " (GMT+2)" (would be ignored by parse() anyway)
    dateString = dateString.replace(/\s*\([^)]+\)\s*$/, '').trim()

    if (hasOffset(dateString)) {
        return OriginalDate.parse(dateString)
    }

    // Need to handle dateString as local time in given timezone
    // pretend date is in UTC to get local time stamp, and get UTC timestamp in the desired timezone
    const localTimestamp = OriginalDate.parse(toUTCDateString(dateString))
    const desiredLocalDate = getDatePartsForLocalTimestamp(localTimestamp)
    return disambiguateDate(desiredLocalDate, timezone)
}

function hasOffset(dateString: string): boolean {
    if (/(?:[Zz]|UTC|GMT)$/i.test(dateString)) {
        return true
    }
    return /(?:[Zz]|UTC|GMT|:.*)\s*[+-]\d{1,2}(:?\d{1,2})?$/.test(dateString)
}

/** there is a very limited number of date-only formats that must be parsed as UTC:
 * - 'YYYY-MM-DD'
 * - 'YYYY-MM'
 * - 'YYYY'
 *
 * Even minor variations should be parsed in local time:
 * - 'YYYY/MM/DD'
 * - 'YYYY-MM-DD '
 * - ' YYYY-MM-DD'
 * - 'YYY'
 * - 'YY'
 */
function isUTCDate(dateString: string): boolean {
    return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(dateString)
}

/** 'convert' a local date string (without any TZ specifier) to a UTC string for parsing the raw contents */
function toUTCDateString(dateString: string): string {
    if (!dateString.includes(':')) {
        // date only string, add time part
        return dateString + ' 00:00Z'
    } else if (!/\d$/.test(dateString)) {
        // does not end in a digit (maybe "AM" or "PM")
        return dateString + ' Z'
    } else {
        return dateString + 'Z'
    }
}
