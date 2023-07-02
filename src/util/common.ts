export const defaultTitleText = 'Time Travel'

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
        __timeTravelTickToggle?: () => void
        __timeTravelTickStartDate?: number
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
    return !!window.__timeTravelTickStartDate
}

export function toggleTick(nowTimestampStr: string) {
    if (window['__timeTravelTickStartDate']) {
        window['__timeTravelTickStartDate'] = undefined
    } else {
        const nowTimestamp: number | undefined = nowTimestampStr ? Number.parseInt(nowTimestampStr) : undefined
        window['__timeTravelTickStartDate'] = nowTimestamp
    }
}

export function isContentScriptInjected() {
    return window.__timeTravelCheckToggle != undefined
}
