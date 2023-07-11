import { setBadgeText } from '../util/browser'
import { getContentScriptState, setBadgeAndTitle } from '../util/common'

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateBadgeAndTitle(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.url == undefined)
        return // url unchanged, nothing to do
    await updateBadgeAndTitle(tabId)
})

chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message == 'active' && sender.tab?.id) {
        await updateBadgeAndTitle(sender.tab.id, true)
    }
})

async function updateBadgeAndTitle(tabId: number, forceOn?: boolean) {
    try {
        const state = await getContentScriptState(tabId)
        await setBadgeAndTitle(tabId, state)
    } catch (e) {
        //ignore errors
        console.log(e)
    }

    if (forceOn) {
        await setBadgeText(tabId, 'ON')
    }
}
