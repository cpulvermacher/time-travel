import { m } from '../paraglide/messages'
import { overwriteGetLocale } from '../paraglide/runtime'
import { getUILanguage, injectFunction, setBadgeText, setTitle } from './browser'
import { getTranslationLocale } from './i18n'
import * as inject from './inject'

declare const __EXT_VERSION__: string
declare const __MODE__: 'dev' | 'production'

const defaultTitleText = 'Time Travel'
const devVersion = __MODE__ === 'dev' ? `\nVersion: ${__EXT_VERSION__}` : ''

type ContentScriptState = {
    contentScriptActive: boolean
    fakeDate: string | null
    tickStartTimestamp: string | null
    isClockStopped: boolean
    fakeDateActive: boolean
}

export type ActivationMessage = {
    msg: 'active'
    fakeDate: string
    tickStartTimestamp: string | null
    isClockStopped: boolean
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
        return formatLocalTime(newDate)
    }

    const timePart = new Date(parsedDateTime)
    newDate.setHours(timePart.getHours())
    newDate.setMinutes(timePart.getMinutes())
    newDate.setSeconds(timePart.getSeconds())
    newDate.setMilliseconds(timePart.getMilliseconds())

    return formatLocalTime(newDate, { fullPrecision: true })
}

/** Get date in YYYY-MM-DD hh:mm format in the specified timezone. */
export function formatDateInTimezone(date: Date, timezone: string): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
    }
    const formatter = new Intl.DateTimeFormat('en', options)
    return formatLocalTime(new Date(formatter.format(date).replace(',', '')))
}

/** Tries parsing a date string, returns a valid date string or null if invalid.
 *
 * If the string is a UNIX timestamp, it is converted into an ISO string instead.
 */
export function parseDate(date: string): string | null {
    if (date && Number.isInteger(+date)) {
        date = new Date(Number.parseInt(date)).toISOString()
    }
    if (date && isNaN(Date.parse(date))) {
        return null
    }
    return date
}

export async function setBadgeAndTitle(tabId: number, state: ContentScriptState) {
    overwriteGetLocale(() => getTranslationLocale(getUILanguage()))

    let badgeText = ''
    if (state.fakeDateActive) {
        badgeText = 'ON'
    }

    await setBadgeText(tabId, badgeText)

    let title = defaultTitleText
    if (state.fakeDateActive && state.fakeDate) {
        const formattedFakeDate = formatLocalTime(new Date(state.fakeDate))

        const titleArgs = { fakeDate: formattedFakeDate }
        title += ' ' + (state.isClockStopped ? m.icon_title_stopped(titleArgs) : m.icon_title_running(titleArgs))
    } else if (state.contentScriptActive) {
        title += ' ' + m.icon_title_off()
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
        isClockStopped: contentScriptActive && !!fakeDate && !tickStartTimestamp,
        fakeDateActive: contentScriptActive && !!fakeDate,
    }
}
