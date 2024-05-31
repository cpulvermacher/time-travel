import { getContentScriptState, setBadgeAndTitle } from '../util/common'

chrome.tabs.onActivated.addListener((activeInfo) => {
    updateBadgeAndTitle(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url == undefined) return // url unchanged, nothing to do

    updateBadgeAndTitle(tabId)
})

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.msg == 'active' && sender.tab?.id) {
        const state = {
            contentScriptActive: true,
            fakeDate: message.fakeDate,
            tickStartTimestamp: message.tickStartTimestamp,
            clockIsRunning: message.isClockTicking,
            fakeDateActive: true,
        }
        setBadgeAndTitle(sender.tab.id, state)
    }
})

async function updateBadgeAndTitle(tabId: number) {
    try {
        const state = await getContentScriptState(tabId)
        await setBadgeAndTitle(tabId, state)
    } catch (e) {
        //ignore errors
        console.log(e)
    }
}
