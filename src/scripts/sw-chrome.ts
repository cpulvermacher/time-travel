import { getContentScriptState, setBadgeAndTitle } from '../util/common'

chrome.tabs.onActivated.addListener((activeInfo) => {
    updateBadgeAndTitle(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url == undefined)
        return // url unchanged, nothing to do

    updateBadgeAndTitle(tabId)
})

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.msg == 'active' && sender.tab?.id) {
        const state = {
            isScriptInjected: true,
            fakeDate: message.fakeDate,
            tickStartDate: message.tickStartDate,
            clockIsRunning: message.isClockTicking,
            fakeDateActive: true
        }
        setBadgeAndTitle(sender.tab.id, state)
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
