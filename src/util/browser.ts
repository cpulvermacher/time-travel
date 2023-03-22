export async function getActiveTabId() {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    return tab.id
}

//Note: needs 'storage' permission
export async function storageGet(key: string) {
    return (await chrome.storage.local.get([key]))[key]
}

export async function setStorage(key: string, value: string) {
    await chrome.storage.local.set({ key: value })
}

export async function injectFunction<Args extends [string]>(
    func: (...args: Args) => void,
    args: Args
) {
    const tabId = await getActiveTabId()
    if (tabId == undefined)
        throw new Error("Couldn't get active tab")

    await chrome.scripting.executeScript({
        target: { tabId },
        func,
        args,
        world: 'MAIN'
    })
}

export async function setBadgeText(text: string) {
    await chrome.action.setBadgeText({
        tabId: await getActiveTabId(),
        text
    })
}