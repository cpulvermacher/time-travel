// all functions here are meant to be injected into the target page

export function getFakeDate() {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
}

export function getTimezone() {
    const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone'
    return window.sessionStorage.getItem(TIMEZONE_STORAGE_KEY)
}

/** sets fake date and timezone and triggers a state update. empty date will disable the fake date */
export function setFakeDate(date: string, timezone?: string) {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone'

    if (date) {
        window.sessionStorage.setItem(FAKE_DATE_STORAGE_KEY, date)
        if (timezone && timezone.trim() !== '') {
            window.sessionStorage.setItem(TIMEZONE_STORAGE_KEY, timezone)
        } else {
            window.sessionStorage.removeItem(TIMEZONE_STORAGE_KEY)
        }
    } else {
        window.sessionStorage.removeItem(FAKE_DATE_STORAGE_KEY)
        window.sessionStorage.removeItem(TIMEZONE_STORAGE_KEY)
    }

    if (window.__timeTravelUpdateState) {
        window.__timeTravelUpdateState()
    }
}

export function getTickStartTimestamp(): string | null {
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp'
    return window.sessionStorage.getItem(TICK_START_STORAGE_KEY)
}

/** enables clock ticking if nowTimestampStr is non-empty */
export function setTickStartTimestamp(nowTimestampStr: string) {
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp'

    if (!nowTimestampStr) {
        window.sessionStorage.removeItem(TICK_START_STORAGE_KEY)
    } else {
        window.sessionStorage.setItem(TICK_START_STORAGE_KEY, nowTimestampStr)
    }
}

export function isContentScriptActive() {
    return window.__timeTravelUpdateState !== undefined
}
