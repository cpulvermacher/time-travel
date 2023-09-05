import { injectFunction, setBadgeText, setTitle } from './browser'
import * as inject from './inject'

export const defaultTitleText = 'Time Travel'

type ContentScriptState = {
    contentScriptActive: boolean
    fakeDate: string | null
    tickStartTimestamp: string | null
    clockIsRunning: boolean
    fakeDateActive: boolean
}

/** Returns date in format "YYYY-MM-DD hh:mm" in local time, or "Invalid Date" if invalid */
export function formatLocalTime(date: Date): string {
    if (isNaN(date.getTime())) {
        return 'Invalid Date'
    }

    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 16).replace('T', ' ')
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
    await setTitle(tabId, title)
}

export async function isContentScriptActive(tabId: number) {
    return !!await injectFunction(tabId, inject.isContentScriptActive, [''])
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
        fakeDateActive: contentScriptActive && !!fakeDate
    }
}