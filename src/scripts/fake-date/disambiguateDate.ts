import { type LocalDateParts, compareDateParts, getDateParts } from './date-parts'

const msPerSecond = 1000
const msPerMinute = 60 * msPerSecond
const msPerHour = 60 * msPerMinute
const msPerDay = 24 * msPerHour

/** for a given date and timezone, returns a single UTC timestamp that produces the desiredDate.
 *
 * In case there is a transition between two timezone offsets (e.g. DST change) that results
 * in two possible matching timestamps, we choose the timestamp before the transition.
 *
 * Implementation similar to temporal-polyfill's GetNamedTimeZoneEpochNanoseconds()
 */
export function disambiguateDate(desiredDate: LocalDateParts, timezone: string): number {
    // create an initial UTC timestamp based on any offset somewhere within 24h
    const timestamp =
        desiredDate.localTimestamp + new Date(desiredDate.localTimestamp).getTimezoneOffset() * msPerMinute
    const oneDayBefore = new Date(timestamp - msPerDay)
    const oneDayAfter = new Date(timestamp + msPerDay)

    const offsetBefore = oneDayBefore.getTimezoneOffset()
    const offsetAfter = oneDayAfter.getTimezoneOffset()
    // if offsets are the same, there is no transition, we can return the timestamp directly
    if (offsetBefore === offsetAfter) {
        return timestamp
    }

    //if offsets differ, there was a transition => check whether each candidate produces the desired local date
    const candidateTimestamps = [
        desiredDate.localTimestamp + offsetBefore * msPerMinute,
        desiredDate.localTimestamp + offsetAfter * msPerMinute,
    ]
    const validTimestamps = candidateTimestamps.filter((ts) => {
        const candidateDate = getDateParts(ts, timezone)
        return compareDateParts(candidateDate, desiredDate)
    })
    if (validTimestamps.length > 0) {
        return validTimestamps[0] // return the first valid timestamp (= before transition)
    }

    //there may not be a valid timestamp, e.g. if the desired local date is skipped due to a DST change
    //in that case return the timestamp as is
    return timestamp
}
