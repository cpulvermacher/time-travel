import * as inject from '../util/inject'
import { getActiveTabId, injectFunction, registerContentScript } from './browser'
import { parseDate } from './date-utils'

export type ContentScriptState = {
    contentScriptActive: boolean
    fakeDate: string | null
    tickStartTimestamp: string | null
    timezone: string | null
    isClockStopped: boolean
    fakeDateActive: boolean
}

/** sets & enables fake date, returns whether page needs reload for content script to be injected
 *
 * if dateString is empty, the fake date is cleared.
 */
export async function setFakeDate(dateString: string, timezone?: string): Promise<boolean> {
    if (import.meta.env.DEV) {
        return true
    }

    const fakeDate = parseDate(dateString)
    if (fakeDate === null) {
        throw new Error('Invalid date format!')
    }

    const tabId = await getActiveTabId()

    let needsReload = false
    if (fakeDate && !(await isContentScriptActive(tabId))) {
        await registerContentScript()
        needsReload = true
    }

    // store UTC time (also avoids issues with `resistFingerprinting` on Firefox)
    const fakeDateUtc = fakeDate ? new Date(fakeDate).toISOString() : ''
    await injectFunction(tabId, inject.setFakeDate, [fakeDateUtc, timezone || ''])

    return needsReload
}

/** set clock ticking state. `setClockState(false)` also resets the start time to now. */
export async function setClockState(stopClock: boolean): Promise<void> {
    const tabId = await getActiveTabId()

    const timestamp = stopClock ? '' : new Date().getTime().toString()
    await injectFunction(tabId, inject.setTickStartTimestamp, [timestamp])
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
