// browser-specific APIs should only be used in this file
declare const __TARGET__: 'chrome' | 'firefox'

let browserApi = chrome
if (__TARGET__ == 'firefox') {
    browserApi = browser
    browserApi.action = browser.browserAction
}

/** get id for current tab, or throw */
export async function getActiveTabId(): Promise<number> {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await browserApi.tabs.query(queryOptions)
    if (tab.id === undefined)
        throw new Error("Couldn't get active tab")

    return tab.id
}

/** does this tab have a file:// URL? (extension access disabled by default) */
export async function isFileUrl(tabId: number): Promise<boolean> {
    const tabDetails = await browserApi.tabs.get(tabId)
    return !!tabDetails.url?.startsWith('file://')
}

/** inject function into MAIN world */
export async function injectFunction<Args extends [string], Result>(
    tabId: number,
    func: (...args: Args) => Result,
    args: Args
): Promise<chrome.scripting.Awaited<Result> | null> {
    let extraOptions = {}
    if (__TARGET__ == 'chrome') {
        extraOptions = { world: 'MAIN' }
    }

    const result = await browserApi.scripting.executeScript({
        target: { tabId },
        func,
        args,
        injectImmediately: true,
        ...extraOptions
    })

    for (const value of result) {
        if (value.result)
            return value.result
    }
    return null
}

/** registers/updates content script */
export async function registerContentScript() {
    async function registerOrUpdate(contentScripts: chrome.scripting.RegisteredContentScript[]) {
        const scripts = await browserApi.scripting.getRegisteredContentScripts({ ids: contentScripts.map(script => script.id) })
        if (scripts.length > 0) {
            await browserApi.scripting.updateContentScripts(contentScripts)
        } else {
            await browserApi.scripting.registerContentScripts(contentScripts)
        }
    }

    let extraOptionsReplaceDate = {}
    let extraOptionsSendActive = {}
    if (__TARGET__ == 'chrome') {
        extraOptionsReplaceDate = { world: 'MAIN' }
        extraOptionsSendActive = { world: 'ISOLATED' }
    }
    const contentScripts: chrome.scripting.RegisteredContentScript[] = [{
        'id': 'replaceDate',
        'js': ['scripts/replace_date.js'],
        'matches': ['<all_urls>'],
        'runAt': 'document_start',
        'allFrames': true,
        'matchOriginAsFallback': true,
        'persistAcrossSessions': false,
        ...extraOptionsReplaceDate
    }, {
        'id': 'sendActive',
        'js': ['scripts/send_active.js'],
        'matches': ['<all_urls>'],
        'runAt': 'document_start',
        'allFrames': false,
        'persistAcrossSessions': false,
        ...extraOptionsSendActive
    }]

    try {
        await registerOrUpdate(contentScripts)
    } catch (error) {
        //matchOriginAsFallback needs Chrome 119+
        console.log('Encountered error when trying to register content script (maybe Chrome < 119?). Retrying without `matchOriginAsFallback` option. Error was: ', error)
        contentScripts.forEach(script => { delete script.matchOriginAsFallback })
        await registerOrUpdate(contentScripts)
    }
}

/** set badge for icon */
export async function setBadgeText(tabId: number | undefined, text: string) {
    await browserApi.action.setBadgeBackgroundColor({ color: '#6060f4' })
    await browserApi.action.setBadgeText({
        tabId,
        text
    })
}

/** set icon tooltip title */
export async function setTitle(tabId: number | undefined, title: string) {
    await browserApi.action.setTitle({
        tabId,
        title
    })
}

/** reload the current tab */
export async function reloadTab() {
    const tabId = await getActiveTabId()
    await browserApi.tabs.reload(tabId)
}