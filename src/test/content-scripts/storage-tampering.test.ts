import { afterEach, describe, expect, it } from 'vitest';
import {
    getFakeDate,
    getTickStartTimestamp,
    UPDATE_STATE_EVENT,
    updateState,
} from '../../content-scripts/fake-date/storage';
import {
    getFakeDate as popupGetFakeDate,
    getTickStartTimestamp as popupGetTickStartTimestamp,
    getTimezone as popupGetTimezone,
    setFakeDate,
    setTickStartTimestamp,
} from '../../util/inject';

// importing this is the equivalent of the content script running at document_start,
// i.e. before any of the tampering done in the tests below
import '../../content-scripts/replace-date';

// Tests for pages that tamper with sessionStorage after document_start:
// - https://github.com/cpulvermacher/time-travel/issues/45 (page calls sessionStorage.clear())
// - https://github.com/cpulvermacher/time-travel/issues/54 (linkedin.com replaces sessionStorage
//   with a wrapper that throws for keys not on an allowlist)
//
// Tests marked with `it.fails` describe the desired behavior and should be
// flipped to `it` once fixed.
//
// Note: happy-dom is a single JavaScript world, so the fact that the functions in
// util/inject.ts run in the ISOLATED world (where the page cannot tamper with
// sessionStorage) cannot be simulated here. Tests below simulate the isolated-world
// write by using a pristine storage reference directly, and verify the MAIN world
// picks up the change while the page-visible sessionStorage is blocked.
// Use test/hostile-storage.html in a real browser for end-to-end verification.

const nativeSessionStorage = window.sessionStorage;

/** replaces window.sessionStorage with a LinkedIn-style wrapper that throws for all keys */
function blockSessionStorage() {
    const blocked = (key: string): never => {
        throw new Error(`Access to the browser storage for the unapproved key ${key} was blocked.`);
    };
    const wrapper = {
        getItem: blocked,
        setItem: blocked,
        removeItem: blocked,
        clear: () => nativeSessionStorage.clear(),
        key: (index: number) => nativeSessionStorage.key(index),
        get length() {
            return nativeSessionStorage.length;
        },
    };
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => wrapper });
}

function restoreSessionStorage() {
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => nativeSessionStorage });
}

/** simulate a page reload: the pagehide handler persists state, then a fresh load loses the
 * in-memory state and re-reads it from storage at document_start */
function simulateReload() {
    window.dispatchEvent(new Event('pagehide'));
    window.__timeTravelState = undefined;
    updateState();
}

describe('page clears sessionStorage (issue #45)', () => {
    afterEach(() => {
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('fake date stays active in current page after sessionStorage.clear()', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);

        window.sessionStorage.clear();

        expect(getFakeDate()).toBe(dateStr);
    });

    it('tick start timestamp stays active in current page after sessionStorage.clear()', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setTickStartTimestamp('1234');

        window.sessionStorage.clear();

        expect(getTickStartTimestamp()).toBe(1234);
    });

    it('fake date survives a reload after the page cleared sessionStorage', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);

        window.sessionStorage.clear();
        simulateReload();

        expect(getFakeDate()).toBe(dateStr);
    });

    it('clock tick state survives a reload after the page cleared sessionStorage', () => {
        setFakeDate('2023-01-01T00:00:00.000Z', 'Europe/London');
        setTickStartTimestamp('1234');

        window.sessionStorage.clear();
        simulateReload();

        expect(getFakeDate()).toBe('2023-01-01T00:00:00.000Z');
        expect(getTickStartTimestamp()).toBe(1234);
    });

    it('fake date survives repeated reloads when the page clears sessionStorage on every load', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);

        for (let i = 0; i < 3; i++) {
            // page wipes our keys during the load; the in-memory copy keeps it active
            window.sessionStorage.clear();
            expect(getFakeDate()).toBe(dateStr);

            simulateReload();
        }

        expect(getFakeDate()).toBe(dateStr);
    });

    it('a disabled fake date is not resurrected on reload', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setFakeDate(''); // user disables it

        simulateReload();

        expect(getFakeDate()).toBeNull();
    });
});

describe('page blocks sessionStorage access (issue #54)', () => {
    afterEach(() => {
        restoreSessionStorage();
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('reading state does not throw while sessionStorage is blocked', () => {
        blockSessionStorage();

        expect(() => updateState()).not.toThrow();
    });

    it('previously set fake date stays active when state is updated while sessionStorage is blocked', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);
        blockSessionStorage();

        updateState();

        expect(getFakeDate()).toBe(dateStr);
    });

    it('fake date set from the isolated world becomes active while sessionStorage is blocked', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        blockSessionStorage();

        // setFakeDate() as injected into the ISOLATED world, where storage is pristine
        nativeSessionStorage.setItem('timeTravelDate', dateStr);
        document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));

        expect(getFakeDate()).toBe(dateStr);
        expect(new Date().toISOString()).toBe(dateStr);
    });

    it('tick start timestamp set from the isolated world becomes active while sessionStorage is blocked', () => {
        // this is the exact key that linkedin.com blocks (see issue #54 screenshot)
        setFakeDate('2023-01-01T00:00:00.000Z');
        blockSessionStorage();

        nativeSessionStorage.setItem('timeTravelTickStartTimestamp', '1234');
        document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));

        expect(getTickStartTimestamp()).toBe(1234);
    });

    it('fake date disabled from the isolated world becomes inactive while sessionStorage is blocked', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        blockSessionStorage();

        nativeSessionStorage.removeItem('timeTravelDate');
        nativeSessionStorage.removeItem('timeTravelTimezone');
        document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));

        expect(getFakeDate()).toBeNull();
    });

    it('fake date survives a reload while sessionStorage stays blocked', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);
        blockSessionStorage();

        // pagehide persists via the original methods, document_start re-reads the same way
        simulateReload();

        expect(getFakeDate()).toBe(dateStr);
    });
});

// the popup and toolbar icon read state via util/inject.ts (injected into the MAIN world).
// These must report the active state from the in-memory copy, not from raw sessionStorage,
// otherwise the icon drops its ON badge and the popup shows the fake date as disabled once
// the page has cleared/blocked sessionStorage.
describe('popup/icon readers report active state after tampering', () => {
    afterEach(() => {
        restoreSessionStorage();
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('report the fake date, timezone and tick state as active after sessionStorage.clear()', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr, 'Europe/London');
        setTickStartTimestamp('1234');

        window.sessionStorage.clear();

        expect(popupGetFakeDate()).toBe(dateStr);
        expect(popupGetTimezone()).toBe('Europe/London');
        expect(popupGetTickStartTimestamp()).toBe('1234');
    });

    it('report the fake date as active while sessionStorage is blocked', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';
        setFakeDate(dateStr);
        blockSessionStorage();

        expect(popupGetFakeDate()).toBe(dateStr);
    });

    it('report disabled once the fake date is turned off', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setFakeDate('');

        expect(popupGetFakeDate()).toBeNull();
        expect(popupGetTimezone()).toBeNull();
        expect(popupGetTickStartTimestamp()).toBeNull();
    });
});
