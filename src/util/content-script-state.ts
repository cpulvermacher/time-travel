import * as inject from '../util/inject';
import { getActiveTabId, injectFunction, registerContentScript } from '../web-ext/browser';

export type ContentScriptState = {
    contentScriptActive: boolean;
    fakeDate: string | null;
    tickStartTimestamp: string | null;
    timezone: string | null;
    isClockStopped: boolean;
    fakeDateActive: boolean;
};

// DEV-only: persist the would-be content-script/tab state in localStorage so the popup UI
// (enable toggle, applied date, clock, timezone) is testable across reloads via the Vite dev server.
type DevTabState = Pick<ContentScriptState, 'fakeDate' | 'tickStartTimestamp' | 'timezone' | 'contentScriptActive'>;
const devTabStateKey = 'timeTravelDevTabState';

function readDevTabState(): DevTabState {
    const empty: DevTabState = {
        fakeDate: null,
        tickStartTimestamp: null,
        timezone: null,
        // Firefox declares the content script in its manifest, so it is active from the start.
        // Chrome registers it on first use, which requires a reload (see setFakeDate()).
        contentScriptActive: navigator.userAgent.includes('Firefox'),
    };
    try {
        return { ...empty, ...JSON.parse(localStorage.getItem(devTabStateKey) ?? '{}') };
    } catch {
        return empty;
    }
}

function writeDevTabState(state: DevTabState) {
    localStorage.setItem(devTabStateKey, JSON.stringify(state));
}

/** sets & enables fake date, returns whether page needs reload for content script to be injected
 *
 * @param date a valid date to set
 */
export async function setFakeDate(date: Date, timezone?: string): Promise<boolean> {
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

    if (Number.isNaN(date.getTime())) {
        throw new Error('setFakeDate(): Invalid date');
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

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
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

    // read from the MAIN-world in-memory state (see util/inject.ts), which survives
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
