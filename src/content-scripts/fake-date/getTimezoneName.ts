/** Returns time zone name for toString()/toTimeString(). */
export function getTimezoneName(date: Date, timezone: string): string {
    const formatter = getLongNameFormatter(timezone);

    try {
        const parts = formatter.formatToParts(date);
        const timeZonePart = parts.find((part) => part.type === 'timeZoneName');
        return timeZonePart ? timeZonePart.value : '';
    } catch {
        return '';
    }
}

function getLongNameFormatter(timezone: string): Intl.DateTimeFormat {
    if (cachedLongNameFormatterForTimezone === timezone && cachedLongNameFormatter !== null) {
        return cachedLongNameFormatter;
    }
    cachedLongNameFormatterForTimezone = timezone;
    cachedLongNameFormatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'long', // technically the format is implementation defined, but Chrome, Firefox and node seem to follow this
        timeZone: timezone,
    });

    return cachedLongNameFormatter;
}

let cachedLongNameFormatter: Intl.DateTimeFormat | null = null;
let cachedLongNameFormatterForTimezone: string | undefined | null = null;
