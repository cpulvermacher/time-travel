import { injectFunction } from './browser'
import { formatLocalDate } from './formatLocalDate'
import * as inject from './inject'

export type ContentScriptState = {
    contentScriptActive: boolean
    fakeDate: string | null
    tickStartTimestamp: string | null
    timezone: string | null
    isClockStopped: boolean
    fakeDateActive: boolean
}

/** Returns a date string in format "YYYY-MM-DD hh:mm..." using the date from `newDate`, and the time from `dateTimeString`.
 *
 * Precision of time part is preserved, but includes at least hours and minutes.
 * `newDate` is interpreted as local time, and the returned string will be in local time.
 */
export function overwriteDatePart(dateTimeString: string, newDate: Date): string {
    const parsedDateTime = parseDate(dateTimeString)
    const timeRegex = /\d{1,2}:\d{1,2}/
    if (parsedDateTime === null || !timeRegex.test(parsedDateTime)) {
        newDate.setHours(0)
        newDate.setMinutes(0)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        return formatLocalDate(newDate)
    }

    const timePart = new Date(parsedDateTime)
    newDate.setHours(timePart.getHours())
    newDate.setMinutes(timePart.getMinutes())
    newDate.setSeconds(timePart.getSeconds())
    newDate.setMilliseconds(timePart.getMilliseconds())

    return formatLocalDate(newDate, { fullPrecision: true })
}

/** Tries parsing a date string, returns a valid date string or null if invalid.
 *
 * If the string is a UNIX timestamp, it is converted into an ISO string instead.
 * Empty strings are returned as is.
 */
export function parseDate(date: string): string | null {
    try {
        if (date && Number.isInteger(+date)) {
            date = new Date(Number.parseInt(date)).toISOString()
        }
        if (date && isNaN(Date.parse(date))) {
            return null
        }
        return date
    } catch {
        return null
    }
}

export async function isContentScriptActive(tabId: number) {
    return !!(await injectFunction(tabId, inject.isContentScriptActive, ['']))
}

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
    const contentScriptActive = await isContentScriptActive(tabId)
    const fakeDate = await injectFunction(tabId, inject.getFakeDate, [''])
    const timezone = await injectFunction(tabId, inject.getTimezone, [''])
    const tickStartTimestamp = await injectFunction(tabId, inject.getTickStartTimestamp, [''])

    return {
        contentScriptActive,
        fakeDate,
        tickStartTimestamp: tickStartTimestamp,
        timezone,
        isClockStopped: contentScriptActive && !!fakeDate && !tickStartTimestamp,
        fakeDateActive: contentScriptActive && !!fakeDate,
    }
}
