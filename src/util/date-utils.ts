export type FormatOptions = {
    fullPrecision: boolean;
};

/** Returns date in format "YYYY-MM-DD HH:mm" in local time, or "Invalid Date" if invalid
 *
 * If options.fullPrecision is true, returns seconds and milliseconds if they are non-zero
 */
export function formatLocalDate(date: Date, options?: FormatOptions): string {
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    // negative years (=before 1BCE) need to be padded with extra digits for Date() to parse them
    const YYYY =
        date.getFullYear() >= 0
            ? String(date.getFullYear()).padStart(4, '0')
            : '-' + String(-date.getFullYear()).padStart(6, '0');
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    let dateStr = `${YYYY}-${MM}-${DD} ${HH}:${mm}`;

    if (options?.fullPrecision) {
        if (date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
            const ss = String(date.getSeconds()).padStart(2, '0');
            dateStr += ':' + ss;
        }
        if (date.getMilliseconds() !== 0) {
            const sss = String(date.getMilliseconds()).padStart(3, '0');
            dateStr += '.' + sss;
        }
    }
    return dateStr;
}

/** Returns time in format "HH:mm" in local time, or "Invalid Date" if invalid */
export function formatLocalTime(date: Date): string {
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return HH + ':' + mm;
}

/** Returns a date string in format "YYYY-MM-DD HH:mm..." using the date from `newDate`, and the time from `dateTimeString`.
 *
 * Precision of time part is preserved, but includes at least hours and minutes.
 * `newDate` is interpreted as local time, and the returned string will be in local time.
 */
export function overwriteDatePart(dateTimeString: string, newDate: Date): string {
    const parsedDateTime = parseDate(dateTimeString);
    const timeRegex = /\d{1,2}:\d{1,2}/;
    if (!parsedDateTime.isValid || !timeRegex.test(dateTimeString)) {
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return formatLocalDate(newDate);
    }

    const timePart = parsedDateTime.date;
    newDate.setHours(timePart.getHours());
    newDate.setMinutes(timePart.getMinutes());
    newDate.setSeconds(timePart.getSeconds());
    newDate.setMilliseconds(timePart.getMilliseconds());

    return formatLocalDate(newDate, { fullPrecision: true });
}

/** Returns a date string in format "YYYY-MM-DD HH:mm..." using the date from `dateTimeString` and the time from `hours` and `minutes`.
 */
export function overwriteTimePart(dateTimeString: string, hours: number, minutes: number): string {
    const parsedDateTime = parseDate(dateTimeString);
    const newDate = parsedDateTime.isValid ? parsedDateTime.date : new Date();

    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return formatLocalDate(newDate);
}

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

/** Tries parsing a date string */
export function parseDate(dateString: string): ParsedDate {
    if (dateString.trim() === '') {
        return { dateString, isValid: false, isReset: true };
    }

    try {
        let date;
        if (Number.isInteger(+dateString)) {
            date = new Date(Number.parseInt(dateString));
        } else {
            date = new Date(dateString);
        }
        if (isNaN(date.getTime())) {
            return { dateString, isValid: false, isReset: false };
        }
        return { dateString, date, isValid: true, isReset: false };
    } catch {
        return { dateString, isValid: false, isReset: false };
    }
}
