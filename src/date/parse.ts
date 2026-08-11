import { OriginalDate } from './original-date';
import { parseWithTimezone } from './parseWithTimezone';

export type ParsedDate = ValidDate | InvalidDate | ResetDate;
export type ValidDate = {
    dateString: string; // unmodified input string
    date: Date;
    isValid: true;
    isReset: false;
};
export type InvalidDate = {
    dateString: string; // unmodified input string
    isValid: false;
    isReset: false;
};
export type ResetDate = {
    dateString: string; // unmodified input string
    isValid: false;
    isReset: true;
};

/** Try parsing a date string
 *
 * If `timezone` is set, strings without offset information are interpreted as local time in that
 * time zone instead of the browser's time zone. UNIX timestamps and strings with an explicit offset
 * (or `Z`) denote an absolute instant and are unaffected.
 */
export function parseDate(dateString: string, timezone?: string): ParsedDate {
    if (dateString.trim() === '') {
        return { dateString, isValid: false, isReset: true };
    }

    const maybeTimestamp = parseTimestamp(dateString);
    try {
        const date =
            maybeTimestamp !== null
                ? new OriginalDate(maybeTimestamp)
                : new OriginalDate(parseWithTimezone(dateString, timezone));

        if (Number.isNaN(date.getTime())) {
            return { dateString, isValid: false, isReset: false };
        }
        return { dateString, date, isValid: true, isReset: false };
    } catch {
        return { dateString, isValid: false, isReset: false };
    }
}

/** Try parsing a timestamp, return null if the string is not a valid integer */
export function parseTimestamp(timestamp: string | null): number | null {
    if (timestamp === null) {
        return null;
    }

    if (/^-?\d+$/.test(timestamp)) {
        const parsed = Number.parseInt(timestamp, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
}
