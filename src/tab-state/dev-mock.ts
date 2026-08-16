// DEV-only stand-in for the real implementation in state.ts: persists the would-be tab state in
// localStorage so the popup UI (enable toggle, applied date, clock, timezone) is testable across
// reloads via the Vite dev server.
//
// In production builds, this is tree-shaken away.

import type { StoredTabState, TabStateApi } from './state';

const devTabStateKey = 'timeTravelDevTabState';

export const devTabState: TabStateApi = {
    async setFakeDate(date: Date, timezone?: string): Promise<boolean> {
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
    },

    async disableFakeDate(): Promise<void> {
        writeDevTabState({ ...readDevTabState(), fakeDate: null });
    },

    async setClockState(stopClock: boolean): Promise<void> {
        writeDevTabState({ ...readDevTabState(), tickStartTimestamp: stopClock ? null : Date.now().toString() });
    },

    /** there is only one mocked tab, so `tabId` is ignored */
    async readTabState(): Promise<StoredTabState> {
        return readDevTabState();
    },
};

function readDevTabState(): StoredTabState {
    const empty: StoredTabState = {
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

function writeDevTabState(state: StoredTabState) {
    localStorage.setItem(devTabStateKey, JSON.stringify(state));
}
