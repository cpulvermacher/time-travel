import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInitialState } from '../../popup/initial-state';
import * as browser from '../../util/browser';
import * as contentScriptState from '../../util/content-script-state';
import { getContentScriptState } from '../../util/content-script-state';
import * as settings from '../../util/settings';

vi.mock('../../util/browser');
vi.mock('../../util/content-script-state');
vi.mock('../../util/settings');

const defaultSettings: settings.Settings = {
    autoReload: true,
    stopClock: false,
    advancedSettingsOpen: false,
    timezone: 'America/New_York',
    recentTimezones: ['Europe/London', 'Asia/Tokyo'],
};

describe('getInitialState', () => {
    const mockedBrowser = vi.mocked(browser);
    const mockedSettings = vi.mocked(settings);

    const originalEnvDev = import.meta.env.DEV;
    beforeEach(() => {
        vi.resetAllMocks();
        mockedSettings.loadSettings.mockResolvedValue(defaultSettings);
    });
    afterEach(() => {
        vi.useRealTimers();
        import.meta.env.DEV = originalEnvDev;
    });

    describe('in development environment', () => {
        it('derives state from the (mocked) content-script state', async () => {
            import.meta.env.DEV = true;
            vi.mocked(getContentScriptState).mockResolvedValue({
                contentScriptActive: true,
                fakeDate: '2023-01-01T12:34:56.789Z',
                tickStartTimestamp: null,
                timezone: 'Asia/Tokyo',
                isClockStopped: true,
                fakeDateActive: true,
            });

            const result = await getInitialState();

            expect(getContentScriptState).toHaveBeenCalledWith(0);
            expect(result.isEnabled).toBe(true);
            expect(result.settings.timezone).toBe('Asia/Tokyo');
            expect(mockedSettings.loadSettings).toHaveBeenCalled();
        });
    });

    describe('in production environment', () => {
        // dates are formatted as local time in the active/drafted time zone, so all fixtures use an
        // explicit UTC instant to stay independent of the machine's time zone.
        // In January, Europe/London is GMT+00:00 and America/New_York is GMT-05:00.
        const fakeDate = new Date('2023-01-01T12:34:56.789Z');
        beforeEach(() => {
            import.meta.env.DEV = false;

            mockedBrowser.getActiveTabId.mockResolvedValue(123);
            mockedBrowser.isAboutUrl.mockResolvedValue(false);
        });

        it('handles enabled state with running clock correctly', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: fakeDate.toISOString(),
                tickStartTimestamp: fakeDate.getTime().toString(),
                timezone: 'Europe/London',
                isClockStopped: false,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            // Use fake timers to control Date.now()
            vi.useFakeTimers();
            vi.setSystemTime(new Date(fakeDate.getTime() + 60 * 1000)); // 1 minute after tick start

            const result = await getInitialState();

            expect(result.isEnabled).toBe(true);
            expect(result.fakeDate).toBe('2023-01-01 12:35');
            expect(result.settings.timezone).toBe('Europe/London');
            expect(result.settings.stopClock).toBe(false);
            expect(result.pageClock).toEqual({ date: fakeDate, tickStart: fakeDate.getTime() });
        });

        it('handles disabled state correctly', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: null,
                tickStartTimestamp: null,
                timezone: null,
                isClockStopped: false,
                fakeDateActive: false,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-01T12:34:00Z'));

            const result = await getInitialState();

            expect(result.isEnabled).toBe(false);
            // current time in the drafted zone (America/New_York), as no fake date is active
            expect(result.fakeDate).toBe('2026-01-01 07:34');
            expect(result.settings.timezone).toBe(defaultSettings.timezone);
            expect(result.settings.stopClock).toBe(defaultSettings.stopClock);
            expect(result.pageClock).toBeUndefined();
        });

        it('handles stopped clock correctly', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: fakeDate.toISOString(),
                tickStartTimestamp: '1640995200000',
                timezone: 'Europe/London',
                isClockStopped: true,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            const result = await getInitialState();

            expect(result.isEnabled).toBe(true);
            expect(result.fakeDate).toBe('2023-01-01 12:34:56.789');
            expect(result.settings.stopClock).toBe(true);
            expect(result.settings.timezone).toBe('Europe/London');
            expect(result.pageClock).toEqual({ date: fakeDate, tickStart: null });
        });

        it('handles invalid fake date correctly', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: 'invalid-date',
                tickStartTimestamp: '1640995200000',
                timezone: 'Europe/London',
                isClockStopped: false,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-01T12:34:00Z'));

            const result = await getInitialState();

            expect(result.isEnabled).toBe(false);
            expect(result.fakeDate).toBe('2026-01-01 07:34');
        });

        it('shows the fake date as local time in the page time zone', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: fakeDate.toISOString(),
                tickStartTimestamp: '1640995200000',
                timezone: 'Asia/Tokyo', // GMT+09:00
                isClockStopped: true,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            const result = await getInitialState();

            expect(result.fakeDate).toBe('2023-01-01 21:34:56.789');
            expect(result.settings.timezone).toBe('Asia/Tokyo');
            // the page clock keeps the actual instant, only the input string is zone-specific
            expect(result.pageClock).toEqual({ date: fakeDate, tickStart: null });
        });

        it('keeps the fake date unambiguous during a repeated hour', async () => {
            // 02:30 happens twice in Europe/Berlin on 2025-10-26, this is the second one (CET)
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: '2025-10-26T01:30:00.000Z',
                tickStartTimestamp: '1640995200000',
                timezone: 'Europe/Berlin',
                isClockStopped: true,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            const result = await getInitialState();

            // without the offset, reapplying would silently move the date to the first 02:30
            expect(result.fakeDate).toBe('2025-10-26 02:30+01:00');
        });

        it('keeps a running clock unambiguous during a repeated hour', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: '2025-10-26T01:30:00.000Z',
                tickStartTimestamp: '1640995200000',
                timezone: 'Europe/Berlin',
                isClockStopped: false,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            vi.useFakeTimers();
            vi.setSystemTime(1640995200000 + 17_500); // 17.5s of tick elapsed

            const result = await getInitialState();

            // the elapsed seconds are not shown, but the offset still has to be
            expect(result.fakeDate).toBe('2025-10-26 02:30+01:00');
        });

        it('handles timezone settings correctly', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: '2023-01-01T12:00:00.000Z',
                tickStartTimestamp: '1640995200000',
                timezone: null, // No timezone in state
                isClockStopped: false,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            const result = await getInitialState();

            expect(result.isEnabled).toBe(true);
            expect(result.settings.timezone).toBe(''); // Empty string when state.timezone is null
        });

        it('ignores an invalid (page-controlled) timezone from state', async () => {
            const mockState: contentScriptState.ContentScriptState = {
                contentScriptActive: true,
                fakeDate: '2023-01-01T12:00:00.000Z',
                tickStartTimestamp: '1640995200000',
                timezone: 'Evil/Not_A_Zone',
                isClockStopped: false,
                fakeDateActive: true,
            };

            vi.mocked(getContentScriptState).mockResolvedValue(mockState);

            const result = await getInitialState();

            expect(result.isEnabled).toBe(true);
            expect(result.settings.timezone).toBe(''); // falls back to browser default
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            import.meta.env.DEV = false;
            mockedBrowser.getActiveTabId.mockResolvedValue(123);
        });

        it('throws error for about: URLs', async () => {
            mockedBrowser.isAboutUrl.mockResolvedValue(true);

            await expect(getInitialState()).rejects.toThrow('Time Travel cannot be used in the current tab.');

            expect(getContentScriptState).not.toHaveBeenCalled();
        });

        it('throws error for file URLs', async () => {
            mockedBrowser.isAboutUrl.mockResolvedValue(false);
            mockedBrowser.isFileUrl.mockResolvedValue(true);
            mockedBrowser.isExtensionGalleryUrl.mockResolvedValue(false);
            vi.mocked(getContentScriptState).mockRejectedValue(new Error('Content script error'));

            await expect(getInitialState()).rejects.toThrow(/To use Time Travel with local files.*/);
        });

        it('throws error for extension gallery URLs', async () => {
            mockedBrowser.isAboutUrl.mockResolvedValue(false);
            mockedBrowser.isFileUrl.mockResolvedValue(false);
            mockedBrowser.isExtensionGalleryUrl.mockResolvedValue(true);
            vi.mocked(getContentScriptState).mockRejectedValue(new Error('Content script error'));

            await expect(getInitialState()).rejects.toThrow(/Time Travel cannot be used in the Chrome Web Store/);
        });
    });
});
