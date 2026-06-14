import { parseTimestamp } from '../../util/date-utils';

const FAKE_DATE_STORAGE_KEY = 'timeTravelDate';
const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone';

// event names must match the literals in util/inject.ts
/** dispatched on `document` to request a full state update */
export const UPDATE_STATE_EVENT = 'timeTravelStateUpdate';
/** dispatched on `document` to update only the clock tick state */
export const UPDATE_TICK_EVENT = 'timeTravelTickUpdate';

const OriginalDate = Date;

// References to the original storage methods, captured at document_start before any page script
// can replace or block sessionStorage (issue #54). Used for all later reads and writes.
const originalSessionStorage = (() => {
    try {
        const storage = window.sessionStorage;
        return {
            getItem: storage.getItem.bind(storage) as Storage['getItem'],
            setItem: storage.setItem.bind(storage) as Storage['setItem'],
            removeItem: storage.removeItem.bind(storage) as Storage['removeItem'],
        };
    } catch {
        //in sandbox, we might not be able to access sessionStorage
        return null;
    }
})();

export function updateState() {
    const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY);
    if (fakeDate === null || Number.isNaN(Date.parse(fakeDate))) {
        window.__timeTravelState = undefined;
        return;
    }

    const timezone = getFromStorage(TIMEZONE_STORAGE_KEY) || null;
    const tickStartTimestamp = parseTimestamp(getFromStorage(TICK_START_STORAGE_KEY));

    window.__timeTravelState = {
        fakeDate,
        timezone,
        tickStartTimestamp,
    };
}

/** update only the clock tick state, keeping the rest of the in-memory state.
 *
 * A full rebuild (updateState) would drop the fake date if the page had cleared sessionStorage
 * (issue #45), so toggling the clock merges just the tick value. No-op if no fake date is active.
 */
export function updateTickState() {
    const state = window.__timeTravelState;
    if (state === undefined) {
        return;
    }
    state.tickStartTimestamp = parseTimestamp(getFromStorage(TICK_START_STORAGE_KEY));
}

/** return key from storage, or null if unset */
function getFromStorage(key: string): string | null {
    if (originalSessionStorage === null) {
        return null;
    }
    try {
        return originalSessionStorage.getItem(key);
    } catch {
        return null;
    }
}

/** write the in-memory state back into sessionStorage (called on `pagehide`).
 *
 * Restores keys a page may have cleared (issue #45) so the next load reads them at
 * document_start. Uses the original bound methods, so a page blocking sessionStorage (issue #54)
 * cannot stop it. Best-effort: writes can still fail (quota, sandbox), losing state on next load.
 */
export function persistState() {
    const state = window.__timeTravelState;
    if (originalSessionStorage === null || state === undefined) {
        return;
    }
    try {
        originalSessionStorage.setItem(FAKE_DATE_STORAGE_KEY, state.fakeDate);

        if (state.timezone) {
            originalSessionStorage.setItem(TIMEZONE_STORAGE_KEY, state.timezone);
        } else {
            originalSessionStorage.removeItem(TIMEZONE_STORAGE_KEY);
        }

        if (state.tickStartTimestamp != null) {
            originalSessionStorage.setItem(TICK_START_STORAGE_KEY, String(state.tickStartTimestamp));
        } else {
            originalSessionStorage.removeItem(TICK_START_STORAGE_KEY);
        }
    } catch {
        //ignore: quota exceeded, sandboxed document, etc.
    }
}

/** return fake date, or null if unset */
export function getFakeDate(): string | null {
    return window.__timeTravelState?.fakeDate ?? null;
}

/** return tick start time, or null if unset/invalid */
export function getTickStartTimestamp(): number | null {
    return window.__timeTravelState?.tickStartTimestamp ?? null;
}

/** return time zone setting, or null to use browser default */
export function getTimezone(): string | null {
    return window.__timeTravelState?.timezone ?? null;
}

/** return the current date/time we want the page to see.
 *
 * This will either be the real current time (extension off),
 * or the fake time, stopped or running (extension on).
 */
export function fakeNowDate(): Date {
    const fakeDate = getFakeDate();
    if (fakeDate !== null) {
        const fakeDateObject = new OriginalDate(fakeDate);
        const startTimestamp = getTickStartTimestamp();
        if (startTimestamp === null) {
            return fakeDateObject;
        } else {
            const elapsed = OriginalDate.now() - startTimestamp;
            return new OriginalDate(fakeDateObject.getTime() + elapsed);
        }
    } else {
        return new OriginalDate();
    }
}
