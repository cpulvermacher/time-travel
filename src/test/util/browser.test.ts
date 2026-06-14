import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getActiveTabId,
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
} from '../../util/browser';

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
    };
}

let chromeMock: ReturnType<typeof createChromeMock>;

beforeEach(() => {
    chromeMock = createChromeMock();
    vi.stubGlobal('chrome', chromeMock);
});

afterEach(() => {
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
        chromeMock.tabs.get.mockResolvedValue({ url: 'https://chrome.google.com/webstore/detail/x' });
        await expect(isExtensionGalleryUrl(1)).resolves.toBe(true);

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

    it('throws after exhausting retries', async () => {
        chromeMock.tabs.query.mockResolvedValue([{ id: 1 }]);
        chromeMock.tabs.get.mockResolvedValue({ status: 'loading' });
        const fn = vi.fn().mockRejectedValue(new Error('still failing'));

        await expect(withTabLoadingRetry(fn, 2, 1)).rejects.toThrow('still failing');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
