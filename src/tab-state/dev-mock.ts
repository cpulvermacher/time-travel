// DEV-only: persist the would-be tab state in localStorage so the popup UI

import type { TabState } from './state';

// (enable toggle, applied date, clock, timezone) is testable across reloads via the Vite dev server.
type DevTabState = Pick<TabState, 'fakeDate' | 'tickStartTimestamp' | 'timezone' | 'contentScriptActive'>;
const devTabStateKey = 'timeTravelDevTabState';

export function readDevTabState(): DevTabState {
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

export function writeDevTabState(state: DevTabState) {
    localStorage.setItem(devTabStateKey, JSON.stringify(state));
}
