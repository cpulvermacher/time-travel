import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as inject from '@/tab-state/inject';
import {
    disableFakeDate,
    getTabState,
    isContentScriptActive,
    setClockState,
    setFakeDate,
    type TabState,
} from '@/tab-state/state';
import * as browser from '@/web-ext/browser';

vi.mock('@/web-ext/browser');

const mockedBrowser = vi.mocked(browser);

const originalEnvDev = import.meta.env.DEV;

beforeEach(() => {
    localStorage.clear();
    import.meta.env.DEV = false;
    mockedBrowser.getActiveTabId.mockResolvedValue(123);
    mockedBrowser.injectFunction.mockResolvedValue(true);
});

afterEach(() => {
    vi.useRealTimers();
    import.meta.env.DEV = originalEnvDev;
});

describe('development build', () => {
    // behaviour of the mock itself is covered in dev-mock.test.ts
    beforeEach(() => {
        import.meta.env.DEV = true;
    });

    it('routes every operation through the localStorage mock instead of injecting', async () => {
        await setFakeDate(new Date('2023-01-01T00:00:00Z'), 'America/New_York');
        await setClockState(false);
        await expect(getTabState(123)).resolves.toMatchObject({ fakeDate: '2023-01-01T00:00:00.000Z' });

        await disableFakeDate();
        await expect(getTabState(123)).resolves.toMatchObject({ fakeDate: null });

        expect(mockedBrowser.injectFunction).not.toHaveBeenCalled();
    });
});

describe('setFakeDate', () => {
    it('throws on an invalid date, before reaching the implementation', async () => {
        await expect(setFakeDate(new Date('not a date'))).rejects.toThrow('Invalid date');
        expect(mockedBrowser.injectFunction).not.toHaveBeenCalled();
    });

    it('stores the date as UTC across all frames and reports no reload when already active', async () => {
        const needsReload = await setFakeDate(new Date('2023-01-01T12:00:00Z'), 'America/New_York');

        expect(needsReload).toBe(false);
        expect(mockedBrowser.registerContentScript).not.toHaveBeenCalled();
        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(
            123,
            inject.setFakeDate,
            ['2023-01-01T12:00:00.000Z', 'America/New_York'],
            'ISOLATED',
            true
        );
    });

    it('passes an empty timezone string when none is given', async () => {
        await setFakeDate(new Date('2023-01-01T12:00:00Z'));

        expect(mockedBrowser.injectFunction).toHaveBeenLastCalledWith(
            123,
            inject.setFakeDate,
            ['2023-01-01T12:00:00.000Z', ''],
            'ISOLATED',
            true
        );
    });

    it('registers the content script and requires a reload when not yet active', async () => {
        // the first injectFunction call is isContentScriptActive
        mockedBrowser.injectFunction.mockResolvedValueOnce(null);

        const needsReload = await setFakeDate(new Date('2023-01-01T12:00:00Z'));

        expect(needsReload).toBe(true);
        expect(mockedBrowser.registerContentScript).toHaveBeenCalled();
    });

    it('throws when storing the fake date fails', async () => {
        // active content script, but the store itself fails
        mockedBrowser.injectFunction.mockResolvedValueOnce(true).mockResolvedValueOnce(null);

        await expect(setFakeDate(new Date('2023-01-01T12:00:00Z'))).rejects.toThrow('failed to store fake date');
    });
});

describe('disableFakeDate', () => {
    it('clears the fake date across all frames', async () => {
        await disableFakeDate();

        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(123, inject.setFakeDate, ['', ''], 'ISOLATED', true);
    });

    it('throws when clearing fails', async () => {
        mockedBrowser.injectFunction.mockResolvedValue(null);

        await expect(disableFakeDate()).rejects.toThrow('failed to clear fake date');
    });
});

describe('setClockState', () => {
    it('clears the start timestamp when stopping the clock', async () => {
        await setClockState(true);

        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(
            123,
            inject.setTickStartTimestamp,
            [''],
            'ISOLATED',
            true
        );
    });

    it('stores the current timestamp when starting the clock', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));

        await setClockState(false);

        const expectedTimestamp = new Date('2023-01-01T12:00:00Z').getTime().toString();
        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(
            123,
            inject.setTickStartTimestamp,
            [expectedTimestamp],
            'ISOLATED',
            true
        );
    });

    it('throws when storing the clock state fails', async () => {
        mockedBrowser.injectFunction.mockResolvedValue(null);

        await expect(setClockState(true)).rejects.toThrow('failed to store clock state');
    });
});

describe('isContentScriptActive', () => {
    it('coerces a truthy injection result to true', async () => {
        await expect(isContentScriptActive(123)).resolves.toBe(true);
        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(123, inject.isContentScriptActive, ['']);
    });

    it('coerces a null injection result to false', async () => {
        mockedBrowser.injectFunction.mockResolvedValue(null);
        await expect(isContentScriptActive(123)).resolves.toBe(false);
    });
});

describe('getTabState', () => {
    /** map injectFunction calls to results based on the injected function */
    function mockInjectResults(results: {
        active: unknown;
        fakeDate: unknown;
        tickStartTimestamp: unknown;
        timezone: unknown;
    }) {
        mockedBrowser.injectFunction.mockImplementation(async (_tabId, func) => {
            if (func === inject.isContentScriptActive) {
                return results.active as never;
            }
            if (func === inject.getFakeDate) {
                return results.fakeDate as never;
            }
            if (func === inject.getTickStartTimestamp) {
                return results.tickStartTimestamp as never;
            }
            if (func === inject.getTimezone) {
                return results.timezone as never;
            }
            return null;
        });
    }

    it('reports an active, running clock', async () => {
        mockInjectResults({
            active: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: '1672574400000',
            timezone: 'America/New_York',
        });

        const expected: TabState = {
            contentScriptActive: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: '1672574400000',
            timezone: 'America/New_York',
            isClockStopped: false,
            fakeDateActive: true,
        };
        await expect(getTabState(1)).resolves.toEqual(expected);
    });

    it('reports a stopped clock when active with a fake date but no start timestamp', async () => {
        mockInjectResults({
            active: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: null,
            timezone: null,
        });

        const state = await getTabState(1);

        expect(state.isClockStopped).toBe(true);
        expect(state.fakeDateActive).toBe(true);
    });

    it('is neither stopped nor active when the content script is inactive', async () => {
        mockInjectResults({
            active: null,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: null,
            timezone: null,
        });

        const state = await getTabState(1);

        expect(state.contentScriptActive).toBe(false);
        expect(state.isClockStopped).toBe(false);
        expect(state.fakeDateActive).toBe(false);
    });

    it('is not active when there is no fake date', async () => {
        mockInjectResults({
            active: true,
            fakeDate: null,
            tickStartTimestamp: null,
            timezone: null,
        });

        const state = await getTabState(1);

        expect(state.fakeDateActive).toBe(false);
        expect(state.isClockStopped).toBe(false);
    });
});
