import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInitialState } from '../../popup/initial-state';
import * as browser from '../../util/browser';
import * as contentScriptState from '../../util/content-script-state';
import * as settings from '../../util/settings';
import { getContentScriptState } from '../../util/content-script-state';

const defaultSettings: settings.Settings = {
    autoReload: true,
    stopClock: false,
    advancedSettingsOpen: false,
    timezone: 'America/New_York',
    recentTimezones: ['Europe/London', 'Asia/Tokyo'],
};

describe('getInitialState', () => {
    vi.mock('../../util/browser');
    vi.mock('../../util/content-script-state');
    vi.mock('../../util/settings');

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
        it('returns  dummy state', async () => {
            import.meta.env.DEV = true;

            const result = await getInitialState();

            expect(result).toEqual({
                isEnabled: true,
                fakeDate: '2005-06-07 08:09',
                settings: defaultSettings,
            });

            expect(mockedSettings.loadSettings).toHaveBeenCalled();
        });
    });

    describe('in production environment', () => {
        const fakeDate = new Date('2023-01-01 12:34:56.789');
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

            const result = await getInitialState();

            expect(result.isEnabled).toBe(false);
            expect(result.fakeDate).toBeUndefined();
            expect(result.settings.timezone).toBe(defaultSettings.timezone);
            expect(result.settings.stopClock).toBe(defaultSettings.stopClock);
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

            const result = await getInitialState();

            expect(result.isEnabled).toBe(false);
            expect(result.fakeDate).toBeUndefined();
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
