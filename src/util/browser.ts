export async function getActiveTabId(): Promise<number> {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    if (tab.id === undefined)
        throw new Error("Couldn't get active tab")

    return tab.id
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