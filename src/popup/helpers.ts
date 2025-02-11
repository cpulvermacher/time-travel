import {
    getActiveTabId,
    injectFunction,
    isExtensionGalleryUrl,
    isFileUrl,
    registerContentScript,
} from '../util/browser'
import { formatLocalTime, getContentScriptState, isContentScriptActive, setBadgeAndTitle } from '../util/common'
import * as inject from '../util/inject'

/** sets fake date, returns whether page needs reload for content script to be injected */
export async function setFakeDate(fakeDate: string): Promise<boolean> {
    // also allow the user to enter a timestamp in milliseconds directly
    if (fakeDate && Number.isInteger(+fakeDate)) {
        fakeDate = new Date(Number.parseInt(fakeDate)).toISOString()
    }
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        throw new Error(
            'Invalid format! Try "2023-03-25 12:40", "2023-03-25" (midnight), "2023-03-25T12:40Z" (UTC), "2023-03-25T12:40:00.120+1130" or number of milliseconds since January 1, 1970.'
        )
    }

    const tabId = await getActiveTabId()

    let needsReload = false
    if (fakeDate && !(await isContentScriptActive(tabId))) {
        await registerContentScript()
        needsReload = true
    }

    await injectFunction(tabId, inject.setFakeDate, [fakeDate])

    const state = await getContentScriptState(tabId)
    await setBadgeAndTitle(tabId, state)

    if (!needsReload) {
        window.close()
    }
    return needsReload
}

/** sets fake date & enables it, returns whether page needs reload for content script to be injected */
export async function setAndEnable(fakeDate: string): Promise<boolean> {
    const tabId = await getActiveTabId()
    const state = await getContentScriptState(tabId)
    if (state.tickStartTimestamp) {
        // we want to start from the new faked date, without any offset
        await resetTickStart(new Date())
    }

    return await setFakeDate(fakeDate)
}

/** toggles clock ticking state, returns true iff the clock was started */
export async function toggleTick(): Promise<boolean> {
    const tabId = await getActiveTabId()
    const state = await getContentScriptState(tabId)

    if (state.clockIsRunning) {
        await resetTickStart(null)
    } else {
        await resetTickStart(new Date())
    }
    return !state.clockIsRunning
}

/** set/reset the clock-tick start time to the given date */
export async function resetTickStart(date: Date | null): Promise<void> {
    const tabId = await getActiveTabId()

    if (date === null) {
        await injectFunction(tabId, inject.setTickStartTimestamp, [''])
    } else {
        const nowTimestampStr = date.getTime().toString()
        await injectFunction(tabId, inject.setTickStartTimestamp, [nowTimestampStr])
    }
}

/** get current state of content script. Throws on permission errors */
export async function getInitialState(): Promise<{ fakeDate?: string; clockIsRunning: boolean }> {
    const tabId = await getActiveTabId()
    try {
        let initialFakeDate
        const state = await getContentScriptState(tabId)
        if (state.fakeDate) {
            const fakeDate = new Date(Date.parse(state.fakeDate))
            if (state.fakeDateActive && state.clockIsRunning && state.tickStartTimestamp) {
                const tickStartTimestamp = Number.parseInt(state.tickStartTimestamp)
                const elapsed = Date.now() - tickStartTimestamp
                const fakeDateNow = new Date(fakeDate.getTime() + elapsed)
                initialFakeDate = formatLocalTime(fakeDateNow)
            } else {
                initialFakeDate = formatLocalTime(fakeDate)
            }
        }

        return {
            fakeDate: initialFakeDate,
            clockIsRunning: state.clockIsRunning,
        }
    } catch (error) {
        if (await isFileUrl(tabId)) {
            throw new Error(
                'To use Time Travel on local files, please enable "Allow access to file URLs" in the extension settings.'
            )
        } else if (await isExtensionGalleryUrl(tabId)) {
            throw new Error(
                'Time Travel cannot be used in the Chrome Web Store. Please switch to a different tab to change the time.'
            )
        } else {
            const message = error instanceof Error ? error.message : ''
            throw new Error('Time Travel cannot be used in the current tab.\n' + message)
        }
    }
}
