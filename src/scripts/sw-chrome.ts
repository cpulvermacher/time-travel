import { injectFunction, setBadgeText, setTitle } from '../util/browser'
import { defaultTitleText } from '../util/common'
import * as inject from '../util/inject'

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
        const fakeDate = await injectFunction(tabId, inject.getFakeDate, [''])
        await setBadgeText(tabId, fakeDate ? 'ON' : '')
        await setTitle(tabId, (fakeDate ? `${defaultTitleText} (${fakeDate})` : defaultTitleText))
    } catch (e) {
        //ignore errors
        console.log(e)
    }

    if (forceOn) {
        await setBadgeText(tabId, 'ON')
    }
}
