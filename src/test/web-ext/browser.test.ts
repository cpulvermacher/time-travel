import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getActiveTabId,
    getBrowserWindowBounds,
    getSettingsStorage,
    getUILanguage,
    injectFunction,
    isAboutUrl,
    isAndroid,
    isExtensionGalleryUrl,
    isFileUrl,
    registerContentScript,
    reloadTab,
    setBadgeText,
    setTitle,
    withTabLoadingRetry,
} from '@/web-ext/browser';

/** build a chrome mock with the namespaces used by browser.ts */
function createChromeMock() {
    return {
        tabs: {
            query: vi.fn(),
            get: vi.fn(),
            reload: vi.fn().mockResolvedValue(undefined),
        },
        scripting: {
            executeScript: vi.fn(),
            getRegisteredContentScripts: vi.fn(),
            updateContentScripts: vi.fn().mockResolvedValue(undefined),
            registerContentScripts: vi.fn().mockResolvedValue(undefined),
        },
        action: {
            setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
            setBadgeText: vi.fn().mockResolvedValue(undefined),
            setTitle: vi.fn().mockResolvedValue(undefined),
        },
        i18n: {
            getUILanguage: vi.fn().mockReturnValue('en-GB'),
        },
        storage: {
            sync: { name: 'sync' },
            local: { name: 'local' },
        },
        runtime: {
            getPlatformInfo: vi.fn(),
        },
        windows: {
            getCurrent: vi.fn(),
        },
    };
}

let chromeMock: ReturnType<typeof createChromeMock>;
const originalEnvDev = import.meta.env.DEV;

beforeEach(() => {
    // these tests exercise the real extension (chrome) code paths, not the dev-server mocks
    import.meta.env.DEV = false;
    chromeMock = createChromeMock();
    vi.stubGlobal('chrome', chromeMock);
});

afterEach(() => {
    import.meta.env.DEV = originalEnvDev;
    vi.unstubAllGlobals();
});

describe('getActiveTabId', () => {
    it('returns the id of the active tab', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 42 }]);

        await expect(getActiveTabId()).resolves.toBe(42);
        expect(chromeMock.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('throws when the active tab has no id', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: undefined }]);

        await expect(getActiveTabId()).rejects.toThrow("Couldn't get active tab");
    });
});

describe('url checks', () => {
    it('isFileUrl detects file:// URLs', async () => {
        chromeMock.tabs.get.mockResolvedValue({ url: 'file:///home/test.html' });
        await expect(isFileUrl(1)).resolves.toBe(true);

        chromeMock.tabs.get.mockResolvedValue({ url: 'https://example.com' });
        await expect(isFileUrl(1)).resolves.toBe(false);
    });

    it('isFileUrl handles missing url', async () => {
        chromeMock.tabs.get.mockResolvedValue({});
        await expect(isFileUrl(1)).resolves.toBe(false);
    });

    it('isExtensionGalleryUrl detects both web store hosts', async () => {
        chromeMock.tabs.get.mockResolvedValue({ url: 'https://chromewebstore.google.com/detail/x' });
        await expect(isExtensionGalleryUrl(1)).resolves.toBe(true);

        chromeMock.tabs.get.mockResolvedValue({ url: 'https://example.com' });
        await expect(isExtensionGalleryUrl(1)).resolves.toBe(false);
    });

    it('isAboutUrl detects about: URLs', async () => {
        chromeMock.tabs.get.mockResolvedValue({ url: 'about:blank' });
        await expect(isAboutUrl(1)).resolves.toBe(true);

        chromeMock.tabs.get.mockResolvedValue({ url: 'https://example.com' });
        await expect(isAboutUrl(1)).resolves.toBe(false);
    });
});

describe('injectFunction', () => {
    const func = (a: string) => a;

    it('returns the first truthy result', async () => {
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: undefined }, { result: 'value' }]);

        await expect(injectFunction(1, func, ['x'])).resolves.toBe('value');

        expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 1 },
            func,
            args: ['x'],
            world: 'MAIN',
            injectImmediately: true,
        });
    });

    it('returns null when no frame produces a result', async () => {
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: undefined }, null]);

        await expect(injectFunction(1, func, ['x'])).resolves.toBeNull();
    });

    it('passes target, world and args through to executeScript', async () => {
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: true }]);

        await injectFunction(7, func, ['arg'], 'ISOLATED');

        expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 7 },
            func,
            args: ['arg'],
            world: 'ISOLATED',
            injectImmediately: true,
        });
    });

    it('targets all frames when allFrames is true', async () => {
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: true }]);

        await injectFunction(7, func, ['arg'], 'ISOLATED', true);

        expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 7, allFrames: true },
            func,
            args: ['arg'],
            world: 'ISOLATED',
            injectImmediately: true,
        });
    });

    it('returns the first truthy result across frames (any frame succeeding counts)', async () => {
        // e.g. a frameset where one child frame could not write its sessionStorage
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: false }, { result: true }]);

        await expect(injectFunction(1, func, ['x'], 'ISOLATED', true)).resolves.toBe(true);
    });

    it('returns null when no frame succeeds', async () => {
        chromeMock.scripting.executeScript.mockResolvedValue([{ result: false }, { result: false }]);

        await expect(injectFunction(1, func, ['x'], 'ISOLATED', true)).resolves.toBeNull();
    });
});

describe('registerContentScript', () => {
    it('updates content scripts when they already exist', async () => {
        chromeMock.scripting.getRegisteredContentScripts.mockResolvedValue([{ id: '01_replaceDate' }]);

        await registerContentScript();

        expect(chromeMock.scripting.updateContentScripts).toHaveBeenCalled();
        expect(chromeMock.scripting.registerContentScripts).not.toHaveBeenCalled();
    });

    it('registers content scripts when none exist', async () => {
        chromeMock.scripting.getRegisteredContentScripts.mockResolvedValue([]);

        await registerContentScript();

        expect(chromeMock.scripting.registerContentScripts).toHaveBeenCalled();
        expect(chromeMock.scripting.updateContentScripts).not.toHaveBeenCalled();
    });

    it('retries without matchOriginAsFallback on error', async () => {
        chromeMock.scripting.getRegisteredContentScripts
            .mockRejectedValueOnce(new Error('Chrome < 119'))
            .mockResolvedValueOnce([]);

        await registerContentScript();

        expect(chromeMock.scripting.registerContentScripts).toHaveBeenCalled();
        const scripts = chromeMock.scripting.registerContentScripts.mock.calls[0][0];
        expect(scripts.every((s: { matchOriginAsFallback?: boolean }) => !('matchOriginAsFallback' in s))).toBe(true);
    });
});

describe('setBadgeText', () => {
    it('sets background color and text', async () => {
        await setBadgeText(5, '1');

        expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#6060f4' });
        expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ tabId: 5, text: '1' });
    });
});

describe('setTitle', () => {
    it('sets the title', async () => {
        await setTitle(5, 'hello');

        expect(chromeMock.action.setTitle).toHaveBeenCalledWith({ tabId: 5, title: 'hello' });
    });
});

describe('reloadTab', () => {
    it('reloads the active tab', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 99 }]);

        await reloadTab();

        expect(chromeMock.tabs.reload).toHaveBeenCalledWith(99);
    });
});

describe('getUILanguage', () => {
    it('uses chrome.i18n when available', () => {
        expect(getUILanguage()).toBe('en-GB');
    });

    it('falls back to navigator.language when chrome is undefined', () => {
        vi.stubGlobal('chrome', undefined);
        vi.stubGlobal('navigator', { language: 'fr-FR' });

        expect(getUILanguage()).toBe('fr-FR');
    });
});

describe('getSettingsStorage', () => {
    it('prefers sync storage', () => {
        expect(getSettingsStorage()).toBe(chromeMock.storage.sync);
    });

    it('falls back to local storage when sync is unavailable', () => {
        chromeMock.storage.sync = undefined as never;
        expect(getSettingsStorage()).toBe(chromeMock.storage.local);
    });

    it('returns undefined when chrome is unavailable', () => {
        vi.stubGlobal('chrome', undefined);
        expect(getSettingsStorage()).toBeUndefined();
    });
});

describe('isAndroid', () => {
    it('returns true on android', async () => {
        chromeMock.runtime.getPlatformInfo.mockResolvedValue({ os: 'android' });
        await expect(isAndroid()).resolves.toBe(true);
    });

    it('returns false on other platforms', async () => {
        chromeMock.runtime.getPlatformInfo.mockResolvedValue({ os: 'linux' });
        await expect(isAndroid()).resolves.toBe(false);
    });

    it('returns false when the API throws', async () => {
        chromeMock.runtime.getPlatformInfo.mockRejectedValue(new Error('nope'));
        await expect(isAndroid()).resolves.toBe(false);
    });

    it('is emulated via `?mobile` in the URL in DEV builds', async () => {
        import.meta.env.DEV = true;
        chromeMock.runtime.getPlatformInfo.mockResolvedValue({ os: 'linux' });
        vi.stubGlobal('location', { search: '?mobile' });
        await expect(isAndroid()).resolves.toBe(true);
    });

    it('ignores `?mobile` in production builds', async () => {
        chromeMock.runtime.getPlatformInfo.mockResolvedValue({ os: 'linux' });
        vi.stubGlobal('location', { search: '?mobile' });
        await expect(isAndroid()).resolves.toBe(false);
    });
});

describe('getBrowserWindowBounds', () => {
    it('returns the vertical edges of the current browser window', async () => {
        chromeMock.windows.getCurrent.mockResolvedValue({ top: 22, left: 100, height: 800, width: 1200 });

        await expect(getBrowserWindowBounds()).resolves.toEqual({ top: 22, bottom: 822 });
    });

    it('returns undefined without the windows API', async () => {
        // Firefox for Android has no chrome.windows, and opens the popup as a full page anyway
        chromeMock.windows = undefined as never;

        await expect(getBrowserWindowBounds()).resolves.toBeUndefined();
    });

    it('returns undefined when chrome is unavailable', async () => {
        vi.stubGlobal('chrome', undefined);

        await expect(getBrowserWindowBounds()).resolves.toBeUndefined();
    });

    it('returns undefined when the window does not report its bounds', async () => {
        chromeMock.windows.getCurrent.mockResolvedValue({ top: 22, height: undefined });
        await expect(getBrowserWindowBounds()).resolves.toBeUndefined();

        chromeMock.windows.getCurrent.mockResolvedValue({ top: undefined, height: 800 });
        await expect(getBrowserWindowBounds()).resolves.toBeUndefined();
    });
});

describe('withTabLoadingRetry', () => {
    it('returns the result on first success', async () => {
        const fn = vi.fn().mockResolvedValue('ok');

        await expect(withTabLoadingRetry(fn)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries while the tab is loading, then succeeds', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 1 }]);
        chromeMock.tabs.get.mockResolvedValue({ status: 'loading' });
        const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');

        await expect(withTabLoadingRetry(fn, 3, 1)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws immediately when the tab is not loading', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 1 }]);
        chromeMock.tabs.get.mockResolvedValue({ status: 'complete' });
        const fn = vi.fn().mockRejectedValue(new Error('boom'));

        await expect(withTabLoadingRetry(fn, 3, 1)).rejects.toThrow('boom');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws the original error when the loading check itself fails', async () => {
        chromeMock.tabs.query.mockRejectedValue(new Error('no active tab'));
        const fn = vi.fn().mockRejectedValue(new Error('boom'));

        await expect(withTabLoadingRetry(fn, 3, 1)).rejects.toThrow('boom');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting retries', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 1 }]);
        chromeMock.tabs.get.mockResolvedValue({ status: 'loading' });
        const fn = vi.fn().mockRejectedValue(new Error('still failing'));

        await expect(withTabLoadingRetry(fn, 2, 1)).rejects.toThrow('still failing');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('DEV builds (Vite dev server, no extension APIs)', () => {
    beforeEach(() => {
        import.meta.env.DEV = true;
    });

    it('getActiveTabId returns a placeholder id', async () => {
        await expect(getActiveTabId()).resolves.toBe(0);
        expect(chromeMock.tabs.query).not.toHaveBeenCalled();
    });

    it('isAboutUrl returns false', async () => {
        await expect(isAboutUrl(1)).resolves.toBe(false);
        expect(chromeMock.tabs.get).not.toHaveBeenCalled();
    });

    it('setBadgeText and setTitle do nothing', async () => {
        await setBadgeText(1, '1');
        await setTitle(1, 'hello');

        expect(chromeMock.action.setBadgeText).not.toHaveBeenCalled();
        expect(chromeMock.action.setTitle).not.toHaveBeenCalled();
    });

    it('reloadTab only logs what would happen', async () => {
        await reloadTab();

        expect(chromeMock.tabs.reload).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Time Travel: reloading tab (mocked)');
    });
});

describe('getSettingsStorage in DEV builds', () => {
    beforeEach(() => {
        import.meta.env.DEV = true;
        vi.stubGlobal('chrome', undefined);
        localStorage.clear();
    });

    it('stores and reads back settings via localStorage', async () => {
        const storage = getSettingsStorage();

        await storage?.set({ a: 1, b: 'two' });

        await expect(storage?.get(['a', 'b'])).resolves.toEqual({ a: 1, b: 'two' });
    });

    it('merges into previously stored settings', async () => {
        const storage = getSettingsStorage();

        await storage?.set({ a: 1 });
        await storage?.set({ b: 2 });

        await expect(storage?.get(['a', 'b'])).resolves.toEqual({ a: 1, b: 2 });
    });

    it('omits keys that were never set', async () => {
        const storage = getSettingsStorage();

        await storage?.set({ a: 1 });

        await expect(storage?.get(['a', 'missing'])).resolves.toEqual({ a: 1 });
    });

    it('accepts a single key and returns everything without keys', async () => {
        const storage = getSettingsStorage();

        await storage?.set({ a: 1, b: 2 });

        await expect(storage?.get('a')).resolves.toEqual({ a: 1 });
        await expect(storage?.get()).resolves.toEqual({ a: 1, b: 2 });
    });

    it('treats corrupt stored data as empty', async () => {
        localStorage.setItem('timeTravelDevSettings', 'not json');
        const storage = getSettingsStorage();

        await expect(storage?.get(['a'])).resolves.toEqual({});
    });
});
