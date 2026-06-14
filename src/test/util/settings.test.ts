import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as browser from '../../util/browser';
import { loadSettings, saveMostRecentTimezone, saveSetting } from '../../util/settings';

vi.mock('../../util/browser');

/** minimal in-memory stand-in for chrome.storage.StorageArea */
function createMockStorage() {
    const data: Record<string, unknown> = {};
    return {
        data,
        set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(data, items);
        }),
        get: vi.fn(async (keys: string[]) => {
            const result: Record<string, unknown> = {};
            for (const key of keys) {
                if (key in data) {
                    result[key] = data[key];
                }
            }
            return result;
        }),
    };
}

let mockStorage: ReturnType<typeof createMockStorage>;

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStorage = createMockStorage();
    vi.mocked(browser).getSettingsStorage.mockReturnValue(mockStorage as unknown as chrome.storage.StorageArea);
});

describe('saveSetting', () => {
    it('writes the value to storage', async () => {
        await saveSetting('autoReload', true);

        expect(mockStorage.set).toHaveBeenCalledWith({ autoReload: true });
        expect(mockStorage.data.autoReload).toBe(true);
    });

    it('does nothing if no storage is available', async () => {
        vi.mocked(browser).getSettingsStorage.mockReturnValue(undefined);

        await expect(saveSetting('autoReload', true)).resolves.toBeUndefined();
    });

    it('swallows errors from storage', async () => {
        mockStorage.set.mockRejectedValue(new Error('rate limit'));

        await expect(saveSetting('autoReload', true)).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});

describe('loadSettings', () => {
    it('returns defaults when storage is empty', async () => {
        const settings = await loadSettings();

        expect(settings).toEqual({
            autoReload: false,
            stopClock: false,
            advancedSettingsOpen: false,
            timezone: '',
            recentTimezones: [],
        });
    });

    it('merges stored values over defaults', async () => {
        mockStorage.data.autoReload = true;
        mockStorage.data.timezone = 'Europe/London';
        mockStorage.data.recentTimezones = ['Asia/Tokyo'];

        const settings = await loadSettings();

        expect(settings.autoReload).toBe(true);
        expect(settings.timezone).toBe('Europe/London');
        expect(settings.recentTimezones).toEqual(['Asia/Tokyo']);
        // unset values keep defaults
        expect(settings.stopClock).toBe(false);
        expect(settings.advancedSettingsOpen).toBe(false);
    });

    it('returns defaults when no storage is available', async () => {
        vi.mocked(browser).getSettingsStorage.mockReturnValue(undefined);

        const settings = await loadSettings();

        expect(settings.timezone).toBe('');
        expect(console.error).toHaveBeenCalledWith('No settings storage available');
    });

    it('returns defaults when storage throws', async () => {
        mockStorage.get.mockRejectedValue(new Error('boom'));

        const settings = await loadSettings();

        expect(settings).toEqual({
            autoReload: false,
            stopClock: false,
            advancedSettingsOpen: false,
            timezone: '',
            recentTimezones: [],
        });
        expect(console.error).toHaveBeenCalled();
    });
});

describe('saveMostRecentTimezone', () => {
    it('does not save empty (disabled) timezone', async () => {
        await saveMostRecentTimezone('');

        expect(mockStorage.set).not.toHaveBeenCalled();
    });

    it('adds a timezone to an empty history', async () => {
        await saveMostRecentTimezone('Europe/London');

        expect(mockStorage.data.recentTimezones).toEqual(['Europe/London']);
    });

    it('prepends the most recent timezone', async () => {
        mockStorage.data.recentTimezones = ['Asia/Tokyo'];

        await saveMostRecentTimezone('Europe/London');

        expect(mockStorage.data.recentTimezones).toEqual(['Europe/London', 'Asia/Tokyo']);
    });

    it('moves an existing timezone to the front without duplicating', async () => {
        mockStorage.data.recentTimezones = ['Asia/Tokyo', 'Europe/London'];

        await saveMostRecentTimezone('Europe/London');

        expect(mockStorage.data.recentTimezones).toEqual(['Europe/London', 'Asia/Tokyo']);
    });

    it('caps the history at 5 entries', async () => {
        mockStorage.data.recentTimezones = ['a', 'b', 'c', 'd', 'e'];

        await saveMostRecentTimezone('f');

        expect(mockStorage.data.recentTimezones).toEqual(['f', 'a', 'b', 'c', 'd']);
    });
});
