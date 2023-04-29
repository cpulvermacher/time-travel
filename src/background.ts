import { injectFunction, setBadgeText, setTitle } from './util/browser'
import { defaultTitleText, getFakeDate } from './util/common'

chrome.runtime.onInstalled.addListener(async () => {
    await chrome.action.setBadgeBackgroundColor({ color: '#6060f4' })
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateBadgeAndTitle(activeInfo.tabId)
})

chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.url.startsWith('chrome://'))
        return
    await updateBadgeAndTitle(details.tabId)
})

async function updateBadgeAndTitle(tabId: number) {
    try {
        const fakeDate = await injectFunction(tabId, getFakeDate, [''])
        await setBadgeText(tabId, fakeDate ? 'ON' : '')
        await setTitle(tabId, defaultTitleText + (fakeDate ? ` (${fakeDate})` : ' (Off)'))
    } catch (e) {
        //ignore errors
        console.warn(e)
    }
}
