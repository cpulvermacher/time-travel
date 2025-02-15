import { injectFunction, setBadgeText, setTitle } from './browser'
import * as inject from './inject'

declare const __EXT_VERSION__: string
declare const __MODE__: 'dev' | 'production'

const defaultTitleText = 'Time Travel'
const devVersion = __MODE__ === 'dev' ? `\nVersion: ${__EXT_VERSION__}` : ''

type ContentScriptState = {
    contentScriptActive: boolean
    fakeDate: string | null
    tickStartTimestamp: string | null
    clockIsRunning: boolean
    fakeDateActive: boolean
}

export type ActivationMessage = {
    msg: 'active'
    fakeDate: string
    tickStartTimestamp: string | null
    isClockTicking: boolean
}

export type FormatOptions = {
    fullPrecision: boolean
}

/** Returns date in format "YYYY-MM-DD hh:mm" in local time, or "Invalid Date" if invalid
 *
 * If options.fullPrecision is true, returns seconds and milliseconds if they are non-zero
 */
export function formatLocalTime(date: Date, options?: FormatOptions): string {
    if (isNaN(date.getTime())) {
        return 'Invalid Date'
    }

    // negative years (=before 1BCE) need to be padded with extra digits for Date() to parse them
    const yyyy =
        date.getFullYear() >= 0
            ? String(date.getFullYear()).padStart(4, '0')
            : '-' + String(-date.getFullYear()).padStart(6, '0')
    let dateStr =
        yyyy +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0') +
        ' ' +
        String(date.getHours()).padStart(2, '0') +
        ':' +
        String(date.getMinutes()).padStart(2, '0')

    if (options?.fullPrecision) {
        if (date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
            dateStr += ':' + String(date.getSeconds()).padStart(2, '0')
        }
        if (date.getMilliseconds() !== 0) {
            dateStr += '.' + String(date.getMilliseconds()).padStart(3, '0')
        }
    }
    return dateStr
}

/** For a date in format "YYYY-MM-DD hh:mm...", returns a new date string in the same format, with the date part replaced by the given date */
export function overwriteDatePart(dateString: string, newDate: Date): string {
    const newDateString = formatLocalTime(newDate).slice(0, 10)
    if (dateString.length <= 11) {
        return newDateString
    }
    return newDateString + dateString.slice(10)
}

export async function setBadgeAndTitle(tabId: number, state: ContentScriptState) {
    let badgeText = ''
    if (state.fakeDateActive) {
        badgeText = 'ON'
    }

    await setBadgeText(tabId, badgeText)

    let title = defaultTitleText
    if (state.fakeDateActive && state.fakeDate) {
        const formattedFakeDate = formatLocalTime(new Date(state.fakeDate))
        const clockState = state.clockIsRunning ? 'ticking' : 'stopped'
        title += ` (${formattedFakeDate} - Clock ${clockState})`
    } else if (state.contentScriptActive) {
        title += ' (Off)'
    }
    title += devVersion
    await setTitle(tabId, title)
}

export async function isContentScriptActive(tabId: number) {
    return !!(await injectFunction(tabId, inject.isContentScriptActive, ['']))
}

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
    const contentScriptActive = await isContentScriptActive(tabId)
    const fakeDate = await injectFunction(tabId, inject.getFakeDate, [''])
    const tickStartTimestamp = await injectFunction(tabId, inject.getTickStartTimestamp, [''])

    return {
        contentScriptActive,
        fakeDate,
        tickStartTimestamp: tickStartTimestamp,
        clockIsRunning: contentScriptActive && !!fakeDate && !!tickStartTimestamp,
        fakeDateActive: contentScriptActive && !!fakeDate,
    }
}
