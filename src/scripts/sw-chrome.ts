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
    if (message.msg == 'active' && sender.tab?.id) {
        const state = {
            isScriptInjected: true,
            fakeDate: message.fakeDate,
            clockIsRunning: message.isClockTicking,
            fakeDateActive: true
        }
        await setBadgeAndTitle(sender.tab.id, state)
    }
})

async function updateBadgeAndTitle(tabId: number) {
    const state = await getContentScriptState(tabId)
    try {
        await setBadgeAndTitle(tabId, state)
    } catch (e) {
        //ignore errors
        console.log(e)
    }
}
