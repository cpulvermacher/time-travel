// browser-specific APIs should only be used in this file
export async function getActiveTabId(): Promise<number> {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    if (tab.id === undefined)
        throw new Error("Couldn't get active tab")

    return tab.id
}

export async function isFileUrl(tabId: number): Promise<boolean> {
    const tabDetails = await chrome.tabs.get(tabId)
    return !!tabDetails.url?.startsWith('file://')
}

export async function injectFunction<Args extends [string], Result>(
    tabId: number,
    func: (...args: Args) => Result,
    args: Args
): Promise<NonNullable<chrome.scripting.Awaited<Result>> | null> {
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func,
        args,
        world: 'MAIN',
        injectImmediately: true,
    })

    for (const value of result) {
        if (value.result)
            return value.result
    }
    return null
}

/** registers/updates content script */
export async function registerContentScript() {
    const contentScripts: chrome.scripting.RegisteredContentScript[] = [{
        'id': 'replaceDate',
        'js': ['scripts/replace_date.js'],
        'world': 'MAIN',
        'matches': ['<all_urls>'],
        'runAt': 'document_start',
        'allFrames': true,
        'persistAcrossSessions': false,
    }, {
        'id': 'sendActive',
        'js': ['scripts/send_active.js'],
        'world': 'ISOLATED',
        'matches': ['<all_urls>'],
        'runAt': 'document_start',
        'allFrames': true,
        'persistAcrossSessions': false,
    }]
    const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: contentScripts.map(script => script.id) })
    if (scripts.length > 0) {
        await chrome.scripting.updateContentScripts(contentScripts)
    } else {
        await chrome.scripting.registerContentScripts(contentScripts)
    }
}

export async function setBadgeText(tabId: number | undefined, text: string) {
    await chrome.action.setBadgeBackgroundColor({ color: '#6060f4' })
    await chrome.action.setBadgeText({
        tabId,
        text
    })
}

export async function setTitle(tabId: number | undefined, title: string) {
    await chrome.action.setTitle({
        tabId,
        title
    })
}

export async function reloadTab() {
    const tabId = await getActiveTabId()
    await chrome.tabs.reload(tabId)
}