/// <reference types="vite/client" />
import { m } from '../paraglide/messages'
import {
    getActiveTabId,
    injectFunction,
    isAboutUrl,
    isExtensionGalleryUrl,
    isFileUrl,
    loadSetting,
    registerContentScript,
} from '../util/browser'
import {
    formatLocalTime,
    getContentScriptState,
    isContentScriptActive,
    parseDate,
    setBadgeAndTitle,
} from '../util/common'
import * as inject from '../util/inject'

/** sets & enables fake date, returns whether page needs reload for content script to be injected */
export async function setFakeDate(dateString: string): Promise<boolean> {
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

    await injectFunction(tabId, inject.setFakeDate, [fakeDate])

    // Also set the timezone if we have one
    //TODO fix setting timezone in setFakeDate
    const timezone = await loadSetting('timezone', undefined)
    await injectFunction(tabId, inject.setTimezone, [timezone || ''])

    return needsReload
}

export async function updateExtensionIcon() {
    const tabId = await getActiveTabId()
    const state = await getContentScriptState(tabId)
    await setBadgeAndTitle(tabId, state)
}

/** set clock ticking state. `setClockState(false)` also resets the start time to now. */
export async function setClockState(stopClock: boolean): Promise<void> {
    const tabId = await getActiveTabId()

    if (stopClock) {
        await injectFunction(tabId, inject.setTickStartTimestamp, [''])
    } else {
        const now = new Date()
        const nowTimestampStr = now.getTime().toString()
        await injectFunction(tabId, inject.setTickStartTimestamp, [nowTimestampStr])
    }
}

export type InitialState = {
    isEnabled: boolean
    fakeDate?: string
    settings: Settings
}

export type Settings = {
    autoReload: boolean
    stopClock: boolean // tab state if time travel is active, stored setting if inactive
    advancedSettingsOpen: boolean
    timezone?: string // undefined means browser default timezone
}

/** get current state of extension. Throws on permission errors */
export async function getState(): Promise<InitialState> {
    const autoReload = await loadSetting('autoReload', false)
    const stopClock = await loadSetting('stopClock', false)
    const advancedSettingsOpen = await loadSetting('advancedSettingsOpen', false)
    const timezone = await loadSetting('timezone', undefined)

    if (import.meta.env.DEV) {
        //return dummy state for testing
        return {
            isEnabled: true,
            fakeDate: '2005-06-07 08:09',
            settings: {
                autoReload,
                stopClock,
                advancedSettingsOpen,
                timezone,
            },
        }
    }

    const tabId = await getActiveTabId()
    try {
        let initialFakeDate
        const state = await getContentScriptState(tabId)
        if (state.fakeDateActive && state.fakeDate) {
            const fakeDate = new Date(Date.parse(state.fakeDate))
            if (!state.isClockStopped && state.tickStartTimestamp) {
                const tickStartTimestamp = Number.parseInt(state.tickStartTimestamp)
                const elapsed = Date.now() - tickStartTimestamp
                const fakeDateNow = new Date(fakeDate.getTime() + elapsed)
                initialFakeDate = formatLocalTime(fakeDateNow)
            } else {
                initialFakeDate = state.fakeDate
            }
        }
        const isEnabled = !!initialFakeDate

        return {
            isEnabled,
            fakeDate: initialFakeDate,
            settings: {
                autoReload,
                stopClock: isEnabled ? state.isClockStopped : stopClock,
                advancedSettingsOpen,
                timezone,
            },
        }
    } catch (error) {
        if (await isFileUrl(tabId)) {
            throw new Error(m.permission_error_file_url())
        } else if (await isExtensionGalleryUrl(tabId)) {
            throw new Error(m.permission_error_extension_gallery())
        } else if (await isAboutUrl(tabId)) {
            throw new Error(m.permission_error_generic())
        } else {
            const message = error instanceof Error ? error.message : ''
            throw new Error(m.permission_error_generic_with_message({ message }))
        }
    }
}
