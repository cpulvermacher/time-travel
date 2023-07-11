import { injectFunction, setBadgeText, setTitle } from './browser'
import * as inject from './inject'

export const defaultTitleText = 'Time Travel'

type ContentScriptState = {
    isScriptInjected: boolean
    fakeDate: string | null
    clockIsRunning: boolean
    fakeDateActive: boolean
}

export async function setBadgeAndTitle(tabId: number, state: ContentScriptState) {
    let badgeText = ''
    if (state.fakeDateActive)
        badgeText = 'ON'

    await setBadgeText(tabId, badgeText)

    let title = defaultTitleText
    if (state.fakeDateActive)
        title += ` (${state.fakeDate})`
    else if (state.isScriptInjected) {
        title += ' (Off)'
    }
    await setTitle(tabId, title)
}

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
    let isScriptInjected = false
    let fakeDate: string | null = null
    let clockIsRunning = false

    try {
        isScriptInjected = !!await injectFunction(tabId, inject.isContentScriptInjected, [''])
        fakeDate = await injectFunction(tabId, inject.getFakeDate, [''])
        clockIsRunning = !!await injectFunction(tabId, inject.isClockTicking, [''])
    } catch {
        //pass
    }

    return {
        isScriptInjected,
        fakeDate,
        clockIsRunning,
        fakeDateActive: isScriptInjected && !!fakeDate
    }
}