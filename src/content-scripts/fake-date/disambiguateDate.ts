import { type LocalDateParts, compareDateParts, getDateParts, getOffsetSeconds } from './date-parts';

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;
const msPerHour = 60 * msPerMinute;
const msPerDay = 24 * msPerHour;

/** for a given date and time zone, returns a single UTC timestamp that produces the desiredDate.
 *
 * In case there is a transition between two time zone offsets (e.g. DST change) that results
 * in two possible matching timestamps, we choose the timestamp before the transition.
 *
 * Implementation similar to temporal-polyfill's GetNamedTimeZoneEpochNanoseconds()
 */
export function disambiguateDate(desiredDate: LocalDateParts, timezone: string): number {
    // create an initial UTC timestamp based on any offset somewhere within 24h
    const timestamp = desiredDate.localTimestamp + getOffsetSeconds(desiredDate.localTimestamp, timezone) * msPerSecond;

    // check the offsets one day before and after the initial timestamp
    const offsetBefore = getOffsetSeconds(timestamp - msPerDay, timezone);
    const offsetAfter = getOffsetSeconds(timestamp + msPerDay, timezone);
    // if offsets are the same, there is no transition, we can return the timestamp directly
    if (offsetBefore === offsetAfter) {
        return timestamp;
    }

    //if offsets differ, there was a transition => check whether each candidate produces the desired local date
    const candidateTimestamps = [
        desiredDate.localTimestamp + offsetBefore * msPerSecond,
        desiredDate.localTimestamp + offsetAfter * msPerSecond,
    ].sort((a, b) => a - b);
    const validTimestamps = candidateTimestamps.filter((ts) => {
        const candidateDate = getDateParts(ts, timezone);
        return compareDateParts(candidateDate, desiredDate);
    });
    if (validTimestamps.length > 0) {
        return validTimestamps[0]; // return the first valid timestamp (= before transition)
    }

    //there may not be a valid timestamp, e.g. if the desired local date is skipped due to a DST change
    //in that case return the UTC timestamp with the offset _after_ the transition
    return candidateTimestamps[1];
}
