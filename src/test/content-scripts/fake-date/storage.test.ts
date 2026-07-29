import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    fakeNowDate,
    getFakeDate,
    getTickStartTimestamp,
    getTimezone,
} from '../../../content-scripts/fake-date/storage';
import { setFakeDate, setTickStartTimestamp } from '../../../util/inject';

//Note: sessionStorage starts empty, so this just sets up the event listener
import '../../../content-scripts/replace-date';

describe('setFakeDate/getFakeDate', () => {
    afterEach(() => {
        setFakeDate('');
    });

    it('returns date if set', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';

        setFakeDate(dateStr);

        expect(getFakeDate()).toBe(dateStr);
    });

    it('returns null if not set', () => {
        expect(getFakeDate()).toBeNull();
    });

    it('returns null for invalid date string', () => {
        setFakeDate('invalid-date');

        expect(getFakeDate()).toBeNull();
    });
});

describe('setTickStartTimestamp/setTickStartTimestamp', () => {
    afterEach(() => {
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('returns timestamp if set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setTickStartTimestamp('1234');

        expect(getTickStartTimestamp()).toBe(1234);
    });

    it('returns null if fake date not set', () => {
        setTickStartTimestamp('1234');

        expect(getTickStartTimestamp()).toBeNull();
    });

    it('returns null for invalid timestamp', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setTickStartTimestamp('not an number');

        expect(getTickStartTimestamp()).toBeNull();
    });

    it('returns null for non-decimal values', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setTickStartTimestamp('0x4123');

        expect(getTickStartTimestamp()).toBeNull();
    });
});

describe('setTimezone/getTimezone', () => {
    afterEach(() => {
        setFakeDate('');
    });

    it('returns timezone if set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z', 'Europe/London');

        expect(getTimezone()).toBe('Europe/London');
    });

    it('returns null if timezone set to empty string', () => {
        setFakeDate('2023-01-01T00:00:00.000Z', '');

        expect(getTimezone()).toBeNull();
    });

    it('returns null if timezone not set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');

        expect(getTimezone()).toBeNull();
    });

    it('returns null if fake date not set', () => {
        setFakeDate('', 'Europe/London');

        expect(getTimezone()).toBeNull();
    });
});

describe('fakeNowDate', () => {
    const fakeDateStr = '2023-01-01T00:00:00.000Z';
    const fakeDateTimestamp = 1672531200000;

    afterEach(() => {
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('returns the real current time if no fake date is set', () => {
        //note: Date is not replaced while the extension is off, so this is the real clock
        const realNow = Date.now();

        const now = fakeNowDate().getTime();

        expect(now).toBeGreaterThanOrEqual(realNow);
        expect(now).toBeLessThan(realNow + 5000);
    });

    it('returns the fake date if the clock is stopped', () => {
        setFakeDate(fakeDateStr);

        expect(fakeNowDate().getTime()).toBe(fakeDateTimestamp);
    });

    it('adds the time elapsed since the tick start timestamp', () => {
        const realNow = Date.now(); //still the real clock, the fake date isn't set yet
        setFakeDate(fakeDateStr);
        setTickStartTimestamp(String(realNow - 5000)); //clock was started 5s ago

        const elapsed = fakeNowDate().getTime() - fakeDateTimestamp;

        expect(elapsed).toBeGreaterThanOrEqual(5000);
        expect(elapsed).toBeLessThan(10000);
    });

    it('returns the fake date if the tick start timestamp is invalid', () => {
        setFakeDate(fakeDateStr);
        setTickStartTimestamp('not a number');

        expect(fakeNowDate().getTime()).toBe(fakeDateTimestamp);
    });
});

// storage.ts captures sessionStorage at document_start and reads it through the captured
// methods; both the capture and the reads can fail in a sandboxed frame or on a page that
// blocks storage access (issue #54). Loading a fresh copy of the module is the only way to
// simulate a failing capture, since it happens once at import time.
describe('unreadable sessionStorage', () => {
    const nativeSessionStorage = window.sessionStorage;

    afterEach(() => {
        Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => nativeSessionStorage });
        nativeSessionStorage.clear();
        window.__timeTravelState = undefined;
        vi.resetModules();
    });

    /** re-import storage.ts, so it captures the currently installed sessionStorage */
    async function loadStorageAtDocumentStart() {
        vi.resetModules();
        return await import('../../../content-scripts/fake-date/storage');
    }

    it('reports no state if sessionStorage is inaccessible (sandboxed frame)', async () => {
        nativeSessionStorage.setItem('timeTravelDate', '2023-01-01T00:00:00.000Z');
        Object.defineProperty(window, 'sessionStorage', {
            configurable: true,
            get: () => {
                throw new Error('Access to sessionStorage is denied for this document.');
            },
        });

        const storage = await loadStorageAtDocumentStart();
        expect(() => storage.updateState()).not.toThrow();

        expect(storage.getFakeDate()).toBeNull();
        expect(storage.getTimezone()).toBeNull();
        expect(storage.getTickStartTimestamp()).toBeNull();
    });

    it('reports no state if reading from sessionStorage throws', async () => {
        let readsThrow = false;
        const wrapper = {
            getItem: (key: string) => {
                if (readsThrow) {
                    throw new Error(`Access to the browser storage for the unapproved key ${key} was blocked.`);
                }
                return nativeSessionStorage.getItem(key);
            },
            setItem: (key: string, value: string) => nativeSessionStorage.setItem(key, value),
            removeItem: (key: string) => nativeSessionStorage.removeItem(key),
        };
        Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => wrapper });
        nativeSessionStorage.setItem('timeTravelDate', '2023-01-01T00:00:00.000Z');

        const storage = await loadStorageAtDocumentStart();
        readsThrow = true; //page starts blocking reads after we captured the methods
        expect(() => storage.updateState()).not.toThrow();

        expect(storage.getFakeDate()).toBeNull();
        expect(storage.getTimezone()).toBeNull();
        expect(storage.getTickStartTimestamp()).toBeNull();
    });
});
