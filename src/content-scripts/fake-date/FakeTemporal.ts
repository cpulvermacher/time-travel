import { getDateParts } from '@/date/date-parts';
import { OriginalTemporal } from '@/date/original-date';
import { optionsWithDefaultTz } from './FakeIntlDateTimeFormat';
import { fakeNowDate, getTimezone } from './storage';

//non-null if implementation supports Temporal API
export let FakeTemporal: typeof Temporal | null = null;

function getZone(timeZone: Temporal.TimeZoneLike | undefined): string | null {
    if (!timeZone) {
        return getTimezone();
    }
    if (typeof timeZone === 'string') {
        return timeZone;
    }
    return timeZone.timeZoneId;
}

if (OriginalTemporal) {
    // a non-null reference to the original Temporal (to avoid ! assertions)
    const SafeTemporal = OriginalTemporal;

    const FakeTemporalNow: typeof Temporal.Now = {
        instant: () => {
            const now = fakeNowDate();
            return new SafeTemporal.Instant(BigInt(now.getTime()) * 1000000n);
        },
        plainDateISO: (timeZone) => {
            const now = fakeNowDate();
            const tz = getZone(timeZone);
            if (!tz) {
                return new SafeTemporal.PlainDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
            }

            const parts = getDateParts(now, tz);
            if (!parts) {
                //TODO?
                throw new RangeError();
            }
            return new SafeTemporal.PlainDate(parts.year, parts.month + 1, parts?.day);
        },
        //limitation: no micro or nanoseconds
        plainDateTimeISO: (timeZone) => {
            const now = fakeNowDate();
            const tz = getZone(timeZone);
            if (!tz) {
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
                //TODO?
                throw new RangeError();
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
            if (!tz) {
                return new SafeTemporal.PlainTime(
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                    now.getMilliseconds()
                );
            }

            const parts = getDateParts(now, tz);
            if (!parts) {
                //TODO?
                throw new RangeError();
            }
            return new SafeTemporal.PlainTime(parts.hour, parts.minute, parts.second, parts.ms);
        },
        timeZoneId: () => {
            return getTimezone() ?? SafeTemporal.Now.timeZoneId();
        },
        zonedDateTimeISO: (timeZone) => {
            const tz = timeZone ?? getTimezone() ?? SafeTemporal.Now.timeZoneId();
            return Temporal.Now.plainDateTimeISO(tz).toZonedDateTime(tz);
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
