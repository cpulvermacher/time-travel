// browser-specific APIs should only be used in this file

/** get id for current tab, or throw */
export async function getActiveTabId(): Promise<number> {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    if (tab.id === undefined) {
        throw new Error("Couldn't get active tab")
    }

    return tab.id
}

/** does this tab have a file:// URL? (extension access disabled by default) */
export async function isFileUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId)
    return !!tabDetails.url?.startsWith('file://')
}

/** does this tab have a Chrome Web Store URL? */
export async function isExtensionGalleryUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId)
    return (
        !!tabDetails.url?.startsWith('https://chrome.google.com/webstore') ||
        !!tabDetails.url?.startsWith('https://chromewebstore.google.com')
    )
}

/** does this tab have an about: URL? (these fail in interesting ways) */
export async function isAboutUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId)
    return !!tabDetails.url?.startsWith('about:')
}

/** inject function into MAIN world */
export async function injectFunction<Args extends [string], Result>(
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
    })

    for (const value of result) {
        if (value?.result) {
            return value.result
        }
    }
    return null
}

/** registers/updates content script */
export async function registerContentScript() {
    async function registerOrUpdate(contentScripts: chrome.scripting.RegisteredContentScript[]) {
        const scripts = await chrome.scripting.getRegisteredContentScripts({
            ids: contentScripts.map((script) => script.id),
        })
        if (scripts.length > 0) {
            await chrome.scripting.updateContentScripts(contentScripts)
        } else {
            await chrome.scripting.registerContentScripts(contentScripts)
        }
    }

    const contentScripts: chrome.scripting.RegisteredContentScript[] = [
        {
            id: 'replaceDate',
            js: ['scripts/replace_date.js'],
            world: 'MAIN',
            matches: ['<all_urls>'],
            runAt: 'document_start',
            allFrames: true,
            matchOriginAsFallback: true,
            persistAcrossSessions: false,
        },
        {
            id: 'sendActive',
            js: ['scripts/send_active.js'],
            world: 'ISOLATED',
            matches: ['<all_urls>'],
            runAt: 'document_start',
            allFrames: false,
            persistAcrossSessions: false,
        },
    ]

    try {
        await registerOrUpdate(contentScripts)
    } catch (error) {
        //matchOriginAsFallback needs Chrome 119+
        console.log(
            'Encountered error when trying to register content script (maybe Chrome < 119?). Retrying without `matchOriginAsFallback` option. Error was: ',
            error
        )
        contentScripts.forEach((script) => {
            delete script.matchOriginAsFallback
        })
        await registerOrUpdate(contentScripts)
    }
}

/** set badge for icon */
export async function setBadgeText(tabId: number | undefined, text: string) {
    await chrome.action.setBadgeBackgroundColor({ color: '#6060f4' })
    await chrome.action.setBadgeText({
        tabId,
        text,
    })
}

/** set icon tooltip title */
export async function setTitle(tabId: number | undefined, title: string) {
    await chrome.action.setTitle({
        tabId,
        title,
    })
}

/** reload the current tab */
export async function reloadTab() {
    const tabId = await getActiveTabId()
    await chrome.tabs.reload(tabId)
}

/** get the browser UI language */
export function getUILanguage(): string {
    if (typeof chrome !== 'undefined' && chrome?.i18n !== undefined) {
        return chrome.i18n.getUILanguage()
    }

    return navigator.language
}
