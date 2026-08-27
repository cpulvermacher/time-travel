import { getDateParts } from '@/date/date-parts';
import { OriginalTemporal } from '@/date/original-date';
import { optionsWithDefaultTz } from './FakeIntlDateTimeFormat';
import { asNamespace } from './own-properties';
import { fakeNowDate, getTimezone } from './storage';

/** builds the faked `Temporal` namespace.
 *
 * `SafeTemporal` is a non-null reference to the original Temporal
 */
const createFakeTemporal = (SafeTemporal: typeof Temporal): typeof Temporal => {
    /** rejects a bad time zone with the original API's error, so a page can't tell us apart.
     *
     * (the explicit type is what lets TypeScript narrow after a call) */
    const throwInvalidZone: (timeZone: unknown) => never = (timeZone) => {
        SafeTemporal.Now.plainDateISO(timeZone as Temporal.TimeZoneLike);
        // zone is fine, so the faked date is out of range: our bug, not the page's
        throw new RangeError(`Time Travel: cannot represent the faked date in time zone "${timeZone}"`);
    };

    /** a fixed instant, only used to run a time zone argument through the original's normalization */
    const epochInstant = SafeTemporal.Instant.fromEpochMilliseconds(0);

    /** the time zone to use, or null for the browser default.
     *
     * Only `undefined` is "not specified"; '', null and 0 are values the original rejects.
     * Anything else is normalized the way the original does, since it accepts more than a plain
     * IANA name: an offset like '+05:30', any ISO 8601 / RFC 9557 string carrying a zone (via an
     * annotation, an offset, or a 'Z' designator), and a ZonedDateTime. `getDateParts()` below
     * understands none of those, so they have to reach it as an identifier. */
    const getZone = (timeZone: Temporal.TimeZoneLike | undefined): string | null => {
        if (timeZone === undefined) {
            return getTimezone();
        }
        // normalization throws the original's error for anything it doesn't accept
        return epochInstant.toZonedDateTimeISO(timeZone).timeZoneId;
    };

    const FakeTemporalNow: typeof Temporal.Now = asNamespace('Temporal.Now', {
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
            return FakeTemporalNow.instant().toZonedDateTimeISO(tz);
        },
    });

    return asNamespace('Temporal', {
        Duration: SafeTemporal.Duration,
        Instant: SafeTemporal.Instant,
        Now: FakeTemporalNow,
        PlainDate: SafeTemporal.PlainDate,
        PlainDateTime: SafeTemporal.PlainDateTime,
        PlainMonthDay: SafeTemporal.PlainMonthDay,
        PlainTime: SafeTemporal.PlainTime,
        PlainYearMonth: SafeTemporal.PlainYearMonth,
        ZonedDateTime: SafeTemporal.ZonedDateTime,
    });
};

//non-null if implementation supports Temporal API
const FakeTemporal = OriginalTemporal ? createFakeTemporal(OriginalTemporal) : null;

/** a polyfill might have defined the global or the prototype method as non-writable or non-configurable */
const warnUnreplaceable = (e: unknown) => {
    console.warn('Time Travel: could not replace Temporal', e);
};

/** the original `Instant.prototype.toLocaleString`, non-null exactly while our patch is installed */
let originalToLocaleString: Temporal.Instant['toLocaleString'] | null = null;

/** replace the global `Temporal` with the faked one. Does nothing without Temporal support. */
export const patchTemporal = () => {
    if (!OriginalTemporal || !FakeTemporal) {
        return;
    }
    try {
        globalThis.Temporal = FakeTemporal;

        // Instant.toLocaleString() is the only Temporal instance method that falls back to the
        // system time zone. We patch this one in-place to reach all Instant instances (no-op if
        // timezone is not faked).
        if (!originalToLocaleString) {
            const original = OriginalTemporal.Instant.prototype.toLocaleString;
            OriginalTemporal.Instant.prototype.toLocaleString = function (locales, options) {
                return original.call(this, locales, optionsWithDefaultTz(options));
            };
            originalToLocaleString = original;
        }
    } catch (e) {
        warnUnreplaceable(e);
    }
};

/** restore the original `Temporal`. Does nothing without Temporal support. */
export const unpatchTemporal = () => {
    if (!OriginalTemporal) {
        return;
    }
    try {
        globalThis.Temporal = OriginalTemporal;

        if (originalToLocaleString) {
            OriginalTemporal.Instant.prototype.toLocaleString = originalToLocaleString;
            originalToLocaleString = null;
        }
    } catch (e) {
        warnUnreplaceable(e);
    }
};
