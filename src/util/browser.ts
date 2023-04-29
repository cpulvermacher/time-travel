export async function getActiveTabId() {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    return tab.id
}

export async function injectFunction<Args extends [string], Result>(
    tabId: number | undefined,
    func: (...args: Args) => Result,
    args: Args
): Promise<NonNullable<chrome.scripting.Awaited<Result>> | null> {
    if (tabId == undefined)
        throw new Error("Couldn't get active tab")

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

export async function setBadgeText(tabId: number | undefined, text: string) {
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
    if (tabId != undefined)
        await chrome.tabs.reload(tabId)
}