export const defaultTitleText = 'Time Travel'

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
    }
}

export function getFakeDate() {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
}

export function setFakeDate(date: string) {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    if (date)
        window.sessionStorage.setItem(FAKE_DATE_STORAGE_KEY, date)
    else
        window.sessionStorage.removeItem(FAKE_DATE_STORAGE_KEY)

    if (window.__timeTravelCheckToggle)
        window.__timeTravelCheckToggle()
}

export function isClockTicking(): boolean {
    const TICK_START_DATE_STORAGE_KEY = 'timeTravelTickStartDate'
    const currentStartDate = window.sessionStorage.getItem(TICK_START_DATE_STORAGE_KEY)
    return currentStartDate != null
}

export function toggleTick(nowTimestampStr: string) {
    const TICK_START_DATE_STORAGE_KEY = 'timeTravelTickStartDate'
    const currentStartDate = window.sessionStorage.getItem(TICK_START_DATE_STORAGE_KEY)

    if (currentStartDate != null) {
        window.sessionStorage.removeItem(TICK_START_DATE_STORAGE_KEY)
    } else {
        window.sessionStorage.setItem(TICK_START_DATE_STORAGE_KEY, nowTimestampStr)
    }
}

export function isContentScriptInjected() {
    return window.__timeTravelCheckToggle != undefined
}
