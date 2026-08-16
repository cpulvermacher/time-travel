import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devTabState } from '@/tab-state/dev-mock';
import type { StoredTabState } from '@/tab-state/state';

const devTabStateKey = 'timeTravelDevTabState';

/** the mock reads the browser from the user agent to decide whether the content script is preregistered */
function fakeUserAgent(browser: 'Chrome' | 'Firefox') {
    vi.stubGlobal('navigator', {
        userAgent:
            browser === 'Firefox'
                ? 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
                : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0',
    });
}

function storedState(): StoredTabState {
    return JSON.parse(localStorage.getItem(devTabStateKey) ?? 'null');
}

beforeEach(() => {
    localStorage.clear();
    fakeUserAgent('Chrome');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('readTabState', () => {
    it('starts out empty on Chrome, where the content script needs to be registered first', async () => {
        const expected: StoredTabState = {
            contentScriptActive: false,
            fakeDate: null,
            tickStartTimestamp: null,
            timezone: null,
        };
        await expect(devTabState.readTabState(0)).resolves.toEqual(expected);
    });

    it('starts out with an active content script on Firefox, which declares it in the manifest', async () => {
        fakeUserAgent('Firefox');

        await expect(devTabState.readTabState(0)).resolves.toMatchObject({ contentScriptActive: true });
    });

    it('reads back what was stored', async () => {
        const state: StoredTabState = {
            contentScriptActive: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: '1672574400000',
            timezone: 'America/New_York',
        };
        localStorage.setItem(devTabStateKey, JSON.stringify(state));

        await expect(devTabState.readTabState(0)).resolves.toEqual(state);
    });

    it('fills in missing fields from a partially stored state', async () => {
        localStorage.setItem(devTabStateKey, JSON.stringify({ fakeDate: '2023-01-01T12:00:00.000Z' }));

        await expect(devTabState.readTabState(0)).resolves.toEqual({
            contentScriptActive: false,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: null,
            timezone: null,
        });
    });

    it('falls back to the empty state on unparsable storage contents', async () => {
        localStorage.setItem(devTabStateKey, 'not json');

        await expect(devTabState.readTabState(0)).resolves.toEqual({
            contentScriptActive: false,
            fakeDate: null,
            tickStartTimestamp: null,
            timezone: null,
        });
    });

    it('ignores the tab id, as there is only one mocked tab', async () => {
        await devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'));

        await expect(devTabState.readTabState(1)).resolves.toEqual(await devTabState.readTabState(2));
    });
});

describe('setFakeDate', () => {
    it('stores the date as UTC and the given timezone', async () => {
        await devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'), 'America/New_York');

        expect(storedState()).toMatchObject({
            fakeDate: '2023-01-01T12:00:00.000Z',
            timezone: 'America/New_York',
        });
    });

    it('stores an empty timezone when none is given', async () => {
        await devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'));

        expect(storedState()).toMatchObject({ timezone: '' });
    });

    it('asks for a reload only on the first activation, like Chrome', async () => {
        await expect(devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'))).resolves.toBe(true);
        expect(storedState()).toMatchObject({ contentScriptActive: true });

        await expect(devTabState.setFakeDate(new Date('2023-01-02T12:00:00Z'))).resolves.toBe(false);
    });

    it('never asks for a reload on Firefox, where the content script is active from the start', async () => {
        fakeUserAgent('Firefox');

        await expect(devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'))).resolves.toBe(false);
    });

    it('keeps the clock state', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
        await devTabState.setClockState(false);

        await devTabState.setFakeDate(new Date('2024-06-01T12:00:00Z'));

        expect(storedState()).toMatchObject({ tickStartTimestamp: '1672574400000' });
    });
});

describe('disableFakeDate', () => {
    it('clears the fake date but keeps the rest of the state', async () => {
        await devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'), 'America/New_York');

        await devTabState.disableFakeDate();

        expect(storedState()).toEqual({
            contentScriptActive: true,
            fakeDate: null,
            tickStartTimestamp: null,
            timezone: 'America/New_York',
        });
    });

    it('works on an empty state', async () => {
        await devTabState.disableFakeDate();

        expect(storedState()).toMatchObject({ fakeDate: null });
    });
});

describe('setClockState', () => {
    it('stores the current timestamp when starting the clock', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));

        await devTabState.setClockState(false);

        expect(storedState()).toMatchObject({ tickStartTimestamp: '1672574400000' });
    });

    it('clears the start timestamp when stopping the clock', async () => {
        await devTabState.setClockState(false);

        await devTabState.setClockState(true);

        expect(storedState()).toMatchObject({ tickStartTimestamp: null });
    });

    it('keeps the fake date', async () => {
        await devTabState.setFakeDate(new Date('2023-01-01T12:00:00Z'), 'America/New_York');

        await devTabState.setClockState(true);

        expect(storedState()).toMatchObject({
            fakeDate: '2023-01-01T12:00:00.000Z',
            timezone: 'America/New_York',
            contentScriptActive: true,
        });
    });
});
