import { getActiveTabId, injectFunction, registerContentScript } from '../web-ext/browser';
import { readDevTabState, writeDevTabState } from './dev-mock';
import * as inject from './inject';

export type TabState = {
    contentScriptActive: boolean;
    fakeDate: string | null;
    tickStartTimestamp: string | null;
    timezone: string | null;
    isClockStopped: boolean;
    fakeDateActive: boolean;
};

/** sets & enables fake date, returns whether page needs reload for content script to be injected
 *
 * @param date a valid date to set
 */
export async function setFakeDate(date: Date, timezone?: string): Promise<boolean> {
    if (Number.isNaN(date.getTime())) {
        throw new Error('setFakeDate(): Invalid date');
    }

    if (import.meta.env.DEV) {
        const state = readDevTabState();
        // the mock has no page to reload, so the content script counts as active immediately, i.e. the
        // reload prompt only shows up on the first activation
        writeDevTabState({
            ...state,
            fakeDate: date.toISOString(),
            timezone: timezone || '',
            contentScriptActive: true,
        });
        return !state.contentScriptActive;
    }

    const tabId = await getActiveTabId();

    let needsReload = false;
    if (!(await isContentScriptActive(tabId))) {
        await registerContentScript();
        needsReload = true;
    }

    // store UTC time (also avoids issues with `resistFingerprinting` on Firefox)
    // inject into all frames so framesets (real content in child frames) are covered too
    const fakeDateUtc = date.toISOString();
    const result = await injectFunction(tabId, inject.setFakeDate, [fakeDateUtc, timezone || ''], 'ISOLATED', true);
    if (result !== true) {
        throw new Error('setFakeDate(): failed to store fake date');
    }

    return needsReload;
}

/** unsets fake date */
export async function disableFakeDate(): Promise<void> {
    if (import.meta.env.DEV) {
        writeDevTabState({ ...readDevTabState(), fakeDate: null });
        return;
    }

    const tabId = await getActiveTabId();
    // clear in all frames, matching how the date is set
    const result = await injectFunction(tabId, inject.setFakeDate, ['', ''], 'ISOLATED', true);
    if (result !== true) {
        throw new Error('disableFakeDate(): failed to clear fake date');
    }
}

/** set clock ticking state. `setClockState(false)` also resets the start time to now. */
export async function setClockState(stopClock: boolean): Promise<void> {
    if (import.meta.env.DEV) {
        writeDevTabState({ ...readDevTabState(), tickStartTimestamp: stopClock ? null : Date.now().toString() });
        return;
    }

    const tabId = await getActiveTabId();

    const timestamp = stopClock ? '' : new Date().getTime().toString();
    // update all frames, matching how the date is set
    const result = await injectFunction(tabId, inject.setTickStartTimestamp, [timestamp], 'ISOLATED', true);
    if (result !== true) {
        throw new Error('setClockState(): failed to store clock state');
    }
}

export async function isContentScriptActive(tabId: number) {
    return !!(await injectFunction(tabId, inject.isContentScriptActive, ['']));
}

export async function getTabState(tabId: number): Promise<TabState> {
    if (import.meta.env.DEV) {
        const { fakeDate, tickStartTimestamp, timezone, contentScriptActive } = readDevTabState();
        return {
            contentScriptActive,
            fakeDate,
            tickStartTimestamp,
            timezone,
            isClockStopped: contentScriptActive && !!fakeDate && !tickStartTimestamp,
            fakeDateActive: contentScriptActive && !!fakeDate,
        };
    }

    // read from the MAIN-world in-memory state (see inject.ts), which survives
    // the page clearing or blocking sessionStorage (issues #45/#54)
    const [contentScriptActive, fakeDate, tickStartTimestamp, timezone] = await Promise.all([
        isContentScriptActive(tabId),
        injectFunction(tabId, inject.getFakeDate, ['']),
        injectFunction(tabId, inject.getTickStartTimestamp, ['']),
        injectFunction(tabId, inject.getTimezone, ['']),
    ]);

    return {
        contentScriptActive,
        fakeDate,
        tickStartTimestamp: tickStartTimestamp,
        timezone,
        isClockStopped: contentScriptActive && !!fakeDate && !tickStartTimestamp,
        fakeDateActive: contentScriptActive && !!fakeDate,
    };
}
