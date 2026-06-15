import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as browser from '../../util/browser';
import {
    type ContentScriptState,
    disableFakeDate,
    getContentScriptState,
    isContentScriptActive,
    setClockState,
    setFakeDate,
} from '../../util/content-script-state';
import * as inject from '../../util/inject';

vi.mock('../../util/browser');
vi.mock('../../util/inject');

const mockedBrowser = vi.mocked(browser);

const originalEnvDev = import.meta.env.DEV;

beforeEach(() => {
    vi.resetAllMocks();
    import.meta.env.DEV = false;
    mockedBrowser.getActiveTabId.mockResolvedValue(123);
});

afterEach(() => {
    vi.useRealTimers();
    import.meta.env.DEV = originalEnvDev;
});

describe('setFakeDate', () => {
    it('returns true without injecting in development', async () => {
        import.meta.env.DEV = true;

        await expect(setFakeDate(new Date('2023-01-01T00:00:00Z'))).resolves.toBe(true);
        expect(mockedBrowser.injectFunction).not.toHaveBeenCalled();
    });

    it('throws on an invalid date', async () => {
        await expect(setFakeDate(new Date('not a date'))).rejects.toThrow('Invalid date');
    });

    it('stores the date as UTC across all frames and reports no reload when already active', async () => {
        mockedBrowser.injectFunction.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

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
        mockedBrowser.injectFunction.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

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
        // first injectFunction call is isContentScriptActive (falsy), second is the store
        mockedBrowser.injectFunction.mockResolvedValueOnce(null).mockResolvedValueOnce(true);

        const needsReload = await setFakeDate(new Date('2023-01-01T12:00:00Z'));

        expect(needsReload).toBe(true);
        expect(mockedBrowser.registerContentScript).toHaveBeenCalled();
    });

    it('throws when storing the fake date fails', async () => {
        mockedBrowser.injectFunction.mockResolvedValueOnce(true).mockResolvedValueOnce(null);

        await expect(setFakeDate(new Date('2023-01-01T12:00:00Z'))).rejects.toThrow('failed to store fake date');
    });
});

describe('disableFakeDate', () => {
    it('does nothing in development', async () => {
        import.meta.env.DEV = true;

        await disableFakeDate();
        expect(mockedBrowser.injectFunction).not.toHaveBeenCalled();
    });

    it('clears the fake date across all frames', async () => {
        mockedBrowser.injectFunction.mockResolvedValue(true);

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
        mockedBrowser.injectFunction.mockResolvedValue(true);

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
        mockedBrowser.injectFunction.mockResolvedValue(true);

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
        mockedBrowser.injectFunction.mockResolvedValue(true);
        await expect(isContentScriptActive(123)).resolves.toBe(true);
        expect(mockedBrowser.injectFunction).toHaveBeenCalledWith(123, inject.isContentScriptActive, ['']);
    });

    it('coerces a null injection result to false', async () => {
        mockedBrowser.injectFunction.mockResolvedValue(null);
        await expect(isContentScriptActive(123)).resolves.toBe(false);
    });
});

describe('getContentScriptState', () => {
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

        const expected: ContentScriptState = {
            contentScriptActive: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: '1672574400000',
            timezone: 'America/New_York',
            isClockStopped: false,
            fakeDateActive: true,
        };
        await expect(getContentScriptState(1)).resolves.toEqual(expected);
    });

    it('reports a stopped clock when active with a fake date but no start timestamp', async () => {
        mockInjectResults({
            active: true,
            fakeDate: '2023-01-01T12:00:00.000Z',
            tickStartTimestamp: null,
            timezone: null,
        });

        const state = await getContentScriptState(1);

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

        const state = await getContentScriptState(1);

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

        const state = await getContentScriptState(1);

        expect(state.fakeDateActive).toBe(false);
        expect(state.isClockStopped).toBe(false);
    });
});
