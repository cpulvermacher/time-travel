const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp'
const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone'

const OriginalDate = Date

/** return key from storage, or null if unset */
function getFromStorage(key: string): string | null {
    try {
        return window.sessionStorage.getItem(key)
    } catch {
        //in sandbox, we might not be able to access sessionStorage
        return null
    }
}

/** return fake date, or null if unset */
export function getFakeDate(): string | null {
    return getFromStorage(FAKE_DATE_STORAGE_KEY)
}

/** return tick start time, or null if unset/invalid */
export function getTickStartTimestamp(): number | null {
    const startTimestamp = getFromStorage(TICK_START_STORAGE_KEY)
    if (startTimestamp === null) {
        return null
    }

    try {
        return Number.parseInt(startTimestamp)
    } catch {
        return null
    }
}

/** return timezone setting, or undefined to use browser default */
export function getTimezone(): string | undefined {
    const timezone = getFromStorage(TIMEZONE_STORAGE_KEY)
    return timezone || undefined
}

/** return the current date/time we want the page to see.
 *
 * This will either be the real current time (extension off),
 * or the fake time, stopped or running (extension on).
 */
export function fakeNowDate(): Date {
    const fakeDate = getFakeDate()
    if (fakeDate !== null) {
        const fakeDateObject = new OriginalDate(fakeDate)
        const startTimestamp = getTickStartTimestamp()
        if (startTimestamp === null) {
            return fakeDateObject
        } else {
            const elapsed = OriginalDate.now() - startTimestamp
            return new OriginalDate(fakeDateObject.getTime() + elapsed)
        }
    } else {
        return new OriginalDate()
    }
}
