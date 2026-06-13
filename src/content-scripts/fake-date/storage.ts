import { parseTimestamp } from '../../util/date-utils';

const FAKE_DATE_STORAGE_KEY = 'timeTravelDate';
const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone';

/** dispatched on `document` to request a state update (must match the literals in util/inject.ts) */
export const UPDATE_STATE_EVENT = 'timeTravelStateUpdate';

const OriginalDate = Date;

// this module is loaded at document_start, before any page script can tamper with
// sessionStorage (e.g. linkedin.com replaces it with a wrapper that throws, see issue #54).
// Keep private references to the original storage methods, bound to the original object,
// for all later reads and writes.
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

/** write the current in-memory state back into sessionStorage.
 *
 * Pages that clear sessionStorage (issue #45) wipe our keys, but the in-memory
 * state in `window.__timeTravelState` survives for the lifetime of the page.
 * Persisting on `pagehide` puts the keys back so the next load can read them at
 * document_start, even if the page clears storage on every load. Uses the original
 * bound methods, so a page replacing/blocking sessionStorage (issue #54) cannot stop it.
 *
 * Best-effort: writes can still fail (quota exceeded, sandboxed document), in which
 * case the state is lost on the next load, as it was before this measure existed.
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
