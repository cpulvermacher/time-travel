// browser-specific APIs should only be used in this file

/** get id for current tab, or throw */
export async function getActiveTabId(): Promise<number> {
    const queryOptions = { active: true, currentWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions);
    if (tab.id === undefined) {
        throw new Error("Couldn't get active tab");
    }

    return tab.id;
}

/** does this tab have a file:// URL? (extension access disabled by default) */
export async function isFileUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId);
    return !!tabDetails.url?.startsWith('file://');
}

/** does this tab have a Chrome Web Store URL? */
export async function isExtensionGalleryUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId);
    return (
        !!tabDetails.url?.startsWith('https://chrome.google.com/webstore') ||
        !!tabDetails.url?.startsWith('https://chromewebstore.google.com')
    );
}

/** does this tab have an about: URL? (these fail in interesting ways) */
export async function isAboutUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId);
    return !!tabDetails.url?.startsWith('about:');
}

/** inject function into MAIN world */
export async function injectFunction<Args extends [string] | [string, string], Result>(
    tabId: number,
    func: (...args: Args) => Result,
    args: Args
): Promise<chrome.scripting.Awaited<Result> | null> {
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func,
        args,
        world: 'MAIN',
        injectImmediately: true,
    });

    for (const value of result) {
        if (value?.result) {
            return value.result;
        }
    }
    return null;
}

/** registers/updates content script */
export async function registerContentScript() {
    async function registerOrUpdate(contentScripts: chrome.scripting.RegisteredContentScript[]) {
        const scripts = await chrome.scripting.getRegisteredContentScripts({
            ids: contentScripts.map((script) => script.id),
        });
        if (scripts.length > 0) {
            await chrome.scripting.updateContentScripts(contentScripts);
        } else {
            await chrome.scripting.registerContentScripts(contentScripts);
        }
    }

    const contentScripts: chrome.scripting.RegisteredContentScript[] = [
        {
            id: 'replaceDate',
            js: ['content-scripts/replace-date.js'],
            world: 'MAIN',
            matches: ['<all_urls>'],
            runAt: 'document_start',
            allFrames: true,
            matchOriginAsFallback: true,
            persistAcrossSessions: false,
        },
        {
            id: 'sendActive',
            js: ['content-scripts/send-active.js'],
            world: 'ISOLATED',
            matches: ['<all_urls>'],
            runAt: 'document_start',
            allFrames: false,
            persistAcrossSessions: false,
        },
    ];

    try {
        await registerOrUpdate(contentScripts);
    } catch (error) {
        //matchOriginAsFallback needs Chrome 119+
        console.log(
            'Encountered error when trying to register content script (maybe Chrome < 119?). Retrying without `matchOriginAsFallback` option. Error was: ',
            error
        );
        contentScripts.forEach((script) => {
            delete script.matchOriginAsFallback;
        });
        await registerOrUpdate(contentScripts);
    }
}

/** set badge for icon */
export async function setBadgeText(tabId: number | undefined, text: string) {
    await chrome.action.setBadgeBackgroundColor({ color: '#6060f4' });
    await chrome.action.setBadgeText({
        tabId,
        text,
    });
}

/** set icon tooltip title */
export async function setTitle(tabId: number | undefined, title: string) {
    await chrome.action.setTitle({
        tabId,
        title,
    });
}

/** reload the current tab */
export async function reloadTab() {
    const tabId = await getActiveTabId();
    await chrome.tabs.reload(tabId);
}

/** get the browser UI language (e.g. "en-GB") */
export function getUILanguage(): string {
    if (typeof chrome !== 'undefined' && chrome?.i18n !== undefined) {
        return chrome.i18n.getUILanguage();
    }

    return navigator.language;
}

/** get synchronized storage if available, local otherwise */
export function getSettingsStorage(): chrome.storage.StorageArea | undefined {
    if (typeof chrome !== 'undefined' && chrome?.storage !== undefined) {
        return chrome.storage.sync || chrome.storage.local;
    }
    return undefined;
}

/** check if the extension is running on Android */
export async function isAndroid(): Promise<boolean> {
    try {
        const platformInfo = await chrome.runtime.getPlatformInfo();
        return platformInfo.os === 'android';
    } catch {
        return false;
    }
}

/** check if the active tab is currently loading */
async function isTabLoading(): Promise<boolean> {
    try {
        const tabId = await getActiveTabId();
        const tab = await chrome.tabs.get(tabId);
        return tab.status === 'loading';
    } catch {
        return false;
    }
}

/** sleep for given number of milliseconds */
async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** retry a function if it fails and the tab is loading */
export async function withTabLoadingRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 100): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt < maxRetries - 1 && (await isTabLoading())) {
                console.log(`Retrying due to loading tab (attempt ${attempt + 1}/${maxRetries}):`, error);
                await sleep(baseDelayMs * Math.pow(2, attempt));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Unreachable code');
}
