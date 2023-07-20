import { injectFunction, setBadgeText, setTitle } from './browser'
import * as inject from './inject'

export const defaultTitleText = 'Time Travel'

type ContentScriptState = {
    isScriptInjected: boolean
    fakeDate: string | null
    tickStartDate: string | null
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
    } else if (state.isScriptInjected) {
        title += ' (Off)'
    }
    await setTitle(tabId, title)
}

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
    let isScriptInjected = false
    let fakeDate: string | null = null
    let tickStartDate: string | null = null

    try {
        isScriptInjected = !!await injectFunction(tabId, inject.isContentScriptInjected, [''])
        fakeDate = await injectFunction(tabId, inject.getFakeDate, [''])
        tickStartDate = await injectFunction(tabId, inject.getTickStartDate, [''])
    } catch {
        //pass
    }

    return {
        isScriptInjected,
        fakeDate,
        tickStartDate,
        clockIsRunning: isScriptInjected && !!fakeDate && !!tickStartDate,
        fakeDateActive: isScriptInjected && !!fakeDate
    }
}