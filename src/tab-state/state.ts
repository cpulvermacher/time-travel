import { getActiveTabId, injectFunction, registerContentScript } from '@/web-ext/browser';
import { devTabState } from './dev-mock';
import * as inject from './inject';

/** the values actually stored per tab; the rest of `TabState` is derived from them */
export type StoredTabState = {
    contentScriptActive: boolean;
    fakeDate: string | null;
    tickStartTimestamp: string | null;
    timezone: string | null;
};

export type TabState = StoredTabState & {
    isClockStopped: boolean;
    fakeDateActive: boolean;
};

/** the tab operations, implemented once against the page (below) and once against localStorage
 * (see dev-mock.ts). Everything exported from this module goes through the implementation picked
 * by `impl()`, so a DEV build never touches the extension APIs.
 */
export type TabStateApi = {
    setFakeDate(date: Date, timezone?: string): Promise<boolean>;
    disableFakeDate(): Promise<void>;
    setClockState(stopClock: boolean): Promise<void>;
    readTabState(tabId: number): Promise<StoredTabState>;
};

/** Resolved per call rather than once at module scope, so tests can flip `import.meta.env.DEV`. */
function impl(): TabStateApi {
    return import.meta.env.DEV ? devTabState : pageTabState;
}

/** sets & enables fake date, returns whether page needs reload for content script to be injected
 *
 * @param date a valid date to set
 */
export async function setFakeDate(date: Date, timezone?: string): Promise<boolean> {
    if (Number.isNaN(date.getTime())) {
        throw new Error('setFakeDate(): Invalid date');
    }

    return impl().setFakeDate(date, timezone);
}

/** unsets fake date */
export async function disableFakeDate(): Promise<void> {
    return impl().disableFakeDate();
}

/** set clock ticking state. `setClockState(false)` also resets the start time to now. */
export async function setClockState(stopClock: boolean): Promise<void> {
    return impl().setClockState(stopClock);
}

export async function getTabState(tabId: number): Promise<TabState> {
    const stored = await impl().readTabState(tabId);
    return {
        ...stored,
        isClockStopped: stored.contentScriptActive && !!stored.fakeDate && !stored.tickStartTimestamp,
        fakeDateActive: stored.contentScriptActive && !!stored.fakeDate,
    };
}

export async function isContentScriptActive(tabId: number) {
    return !!(await injectFunction(tabId, inject.isContentScriptActive, ['']));
}

/** the real implementation: talks to the page via injected functions */
const pageTabState: TabStateApi = {
    async setFakeDate(date: Date, timezone?: string): Promise<boolean> {
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
    },

    async disableFakeDate(): Promise<void> {
        const tabId = await getActiveTabId();
        // clear in all frames, matching how the date is set
        const result = await injectFunction(tabId, inject.setFakeDate, ['', ''], 'ISOLATED', true);
        if (result !== true) {
            throw new Error('disableFakeDate(): failed to clear fake date');
        }
    },

    async setClockState(stopClock: boolean): Promise<void> {
        const tabId = await getActiveTabId();

        const timestamp = stopClock ? '' : new Date().getTime().toString();
        // update all frames, matching how the date is set
        const result = await injectFunction(tabId, inject.setTickStartTimestamp, [timestamp], 'ISOLATED', true);
        if (result !== true) {
            throw new Error('setClockState(): failed to store clock state');
        }
    },

    async readTabState(tabId: number): Promise<StoredTabState> {
        // read from the MAIN-world in-memory state (see inject.ts), which survives
        // the page clearing or blocking sessionStorage (issues #45/#54)
        const [contentScriptActive, fakeDate, tickStartTimestamp, timezone] = await Promise.all([
            isContentScriptActive(tabId),
            injectFunction(tabId, inject.getFakeDate, ['']),
            injectFunction(tabId, inject.getTickStartTimestamp, ['']),
            injectFunction(tabId, inject.getTimezone, ['']),
        ]);

        return { contentScriptActive, fakeDate, tickStartTimestamp, timezone };
    },
};
