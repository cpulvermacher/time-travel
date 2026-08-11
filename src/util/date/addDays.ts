import { compareDateParts, getDateParts, getDatePartsForLocalDate } from './date-parts';
import { disambiguateDate } from './disambiguateDate';
import { getOffsetSeconds } from './offset';
import { OriginalDate } from './original-date';

const msPerSecond = 1000;

/** Returns the instant `days` days after `date`, keeping the wall clock time in `timezone`.
 *
 * Stepping the wall clock instead of the instant means the step is 23 or 25 hours long where a DST
 * transition is crossed, i.e. the time of day stays the same. A wall clock time that does not exist
 * in that time zone (the hour skipped by a transition) moves forward with the transition, see
 * disambiguateDate().
 *
 * If `timezone` is empty, the browser time zone is used.
 */
export function addDays(date: Date, days: number, timezone: string): Date {
    if (!timezone) {
        const newDate = new OriginalDate(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    const parts = getDateParts(date, timezone);
    if (!parts) {
        return new OriginalDate(NaN);
    }

    // an overflowing day is resolved by getDatePartsForLocalDate()
    const desiredDate = getDatePartsForLocalDate(
        parts.year,
        parts.month,
        parts.day + days,
        parts.hour,
        parts.minute,
        parts.second,
        parts.ms
    );

    // Within an hour repeated by a transition, disambiguateDate() always picks the first of the two
    // instants. Prefer the one with the same UTC offset as `date` if that is a valid reading of the
    // desired wall clock time, so an explicit offset (see formatUnambiguousDate) survives the step
    // and stepping back and forth returns to the same instant.
    const sameOffsetTimestamp = desiredDate.localTimestamp + getOffsetSeconds(date.getTime(), timezone) * msPerSecond;
    if (compareDateParts(getDateParts(sameOffsetTimestamp, timezone), desiredDate)) {
        return new OriginalDate(sameOffsetTimestamp);
    }

    return new OriginalDate(disambiguateDate(desiredDate, timezone));
}
