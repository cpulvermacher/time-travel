import { getDateParts } from '@/date/date-parts';
import { OriginalTemporal } from '@/date/original-date';
import { optionsWithDefaultTz } from './FakeIntlDateTimeFormat';
import { fakeNowDate, getTimezone } from './storage';

//non-null if implementation supports Temporal API
export let FakeTemporal: typeof Temporal | null = null;

if (OriginalTemporal) {
    // a non-null reference to the original Temporal (to avoid ! assertions)
    const SafeTemporal = OriginalTemporal;

    /** rejects a bad time zone with the original API's error, so a page can't tell us apart.
     *
     * (the explicit type is what lets TypeScript narrow after a call) */
    const throwInvalidZone: (timeZone: unknown) => never = (timeZone) => {
        SafeTemporal.Now.plainDateISO(timeZone as Temporal.TimeZoneLike);
        // zone is fine, so the faked date is out of range: our bug, not the page's
        throw new RangeError(`Time Travel: cannot represent the faked date in time zone "${timeZone}"`);
    };

    /** the time zone to use, or null for the browser default.
     *
     * Only `undefined` is "not specified"; '', null and 0 are values the original rejects. */
    const getZone = (timeZone: Temporal.TimeZoneLike | undefined): string | null => {
        if (timeZone === undefined) {
            return getTimezone();
        }
        if (typeof timeZone === 'string') {
            // an invalid string fails in getDateParts() below
            return timeZone;
        }
        if (!(timeZone instanceof SafeTemporal.ZonedDateTime)) {
            // the only object the original accepts
            throwInvalidZone(timeZone);
        }
        return timeZone.timeZoneId;
    };

    const FakeTemporalNow: typeof Temporal.Now = {
        instant: () => {
            const now = fakeNowDate();
            return new SafeTemporal.Instant(BigInt(now.getTime()) * 1000000n);
        },
        plainDateISO: (timeZone) => {
            const now = fakeNowDate();
            const tz = getZone(timeZone);
            if (tz === null) {
                return new SafeTemporal.PlainDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
            }

            const parts = getDateParts(now, tz);
            if (!parts) {
                throwInvalidZone(timeZone);
            }
            return new SafeTemporal.PlainDate(parts.year, parts.month + 1, parts.day);
        },
        //limitation: no micro or nanoseconds
        plainDateTimeISO: (timeZone) => {
            const now = fakeNowDate();
            const tz = getZone(timeZone);
            if (tz === null) {
                return new SafeTemporal.PlainDateTime(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                    now.getMilliseconds()
                );
            }

            const parts = getDateParts(now, tz);
            if (!parts) {
                throwInvalidZone(timeZone);
            }
            return new SafeTemporal.PlainDateTime(
                parts.year,
                parts.month + 1,
                parts.day,
                parts.hour,
                parts.minute,
                parts.second,
                parts.ms
            );
        },
        plainTimeISO: (timeZone) => {
            const now = fakeNowDate();
            const tz = getZone(timeZone);
            if (tz === null) {
                return new SafeTemporal.PlainTime(
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                    now.getMilliseconds()
                );
            }

            const parts = getDateParts(now, tz);
            if (!parts) {
                throwInvalidZone(timeZone);
            }
            return new SafeTemporal.PlainTime(parts.hour, parts.minute, parts.second, parts.ms);
        },
        timeZoneId: () => {
            return getTimezone() ?? SafeTemporal.Now.timeZoneId();
        },
        zonedDateTimeISO: (timeZone) => {
            const tz = getZone(timeZone) ?? SafeTemporal.Now.timeZoneId();
            return FakeTemporalNow.plainDateTimeISO(tz).toZonedDateTime(tz);
        },
    };

    FakeTemporal = {
        Duration: OriginalTemporal.Duration,
        Instant: OriginalTemporal.Instant,
        Now: FakeTemporalNow,
        PlainDate: OriginalTemporal.PlainDate,
        PlainDateTime: OriginalTemporal.PlainDateTime,
        PlainMonthDay: OriginalTemporal.PlainMonthDay,
        PlainTime: OriginalTemporal.PlainTime,
        PlainYearMonth: OriginalTemporal.PlainYearMonth,
        ZonedDateTime: OriginalTemporal.ZonedDateTime,
    };

    // Instant.toLocaleString() is the only Temporal instance method that falls back to the system
    // time zone. We patch this one in-place to reach all Instant instances (no-op if timezone is not faked)
    const originalToLocaleString = SafeTemporal.Instant.prototype.toLocaleString;
    SafeTemporal.Instant.prototype.toLocaleString = function (locales, options) {
        return originalToLocaleString.call(this, locales, optionsWithDefaultTz(options));
    };
}
