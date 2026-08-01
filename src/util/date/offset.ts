import { getDateParts } from './date-parts';
import { parseWithTimezone } from './parseWithTimezone';

/** Returns true if `dateString` parses to a date that has the given UTC offset in `timezone` */
export function parsesToOffset(dateString: string, timezone: string, offsetSeconds: number): boolean {
    const timestamp = parseWithTimezone(dateString, timezone);
    return !Number.isNaN(timestamp) && getOffsetSeconds(timestamp, timezone) === offsetSeconds;
}

/** Returns the UTC offset of `timezone` at `date` in the format "+01:00", or '' if unavailable */
export function getUtcOffset(date: Date, timezone: string): string {
    const offsetName = getDateParts(date, timezone)?.offsetName;
    if (!offsetName) {
        return '';
    }
    // longOffset is just "GMT" for a zero offset
    return offsetName === 'GMT' ? '+00:00' : offsetName.replace('GMT', '');
}

/** Gets time zone offset in seconds from a longOffset string, e.g. "GMT+02:00" -> -7200.
 *
 * Sign convention is the same as for `Date.getTimezoneOffset()`, i.e. positive values are west of UTC.
 * Returns 0 for missing or unparsable input (`longOffset` is just "GMT" for a zero offset).
 */
export function parseLongOffsetSeconds(longOffset?: string): number {
    // match offset with optional seconds part, e.g. "GMT+02:00", "GMT-05:30", "GMT+05:30:45"
    const match = longOffset?.match(/GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        return 0;
    }

    // the sign must be taken from the matched character: parseInt('-00') is -0, which is not < 0
    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const seconds = match[4] ? parseInt(match[4], 10) : 0;
    return -sign * (hours * 60 * 60 + minutes * 60 + seconds) || 0; // avoid -0 for UTC
}

/** Gets time zone offset in seconds for given date and time zone.
 *
 * Sign convention is the same as for `Date.getTimezoneOffset()`, i.e. positive values are west of UTC.
 */
export function getOffsetSeconds(date: number, timezone: string): number {
    return parseLongOffsetSeconds(getDateParts(date, timezone)?.offsetName);
}

/** Gets time zone offset in minutes from a longOffset string.
 *
 * This matches the output of `Date.getTimezoneOffset()`, including the sign. Zones with a
 * sub-minute offset (historic LMT) are truncated towards zero, just like the native method.
 *
 * Example: "GMT+02:00" -> -120
 */
export function getOffsetMinutes(longOffset: string): number {
    return Math.trunc(parseLongOffsetSeconds(longOffset) / 60) || 0; // avoid -0 for UTC
}
