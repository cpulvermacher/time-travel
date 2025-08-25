import { getContentScriptState, setBadgeAndTitle, type ActivationMessage } from '../util/common'

chrome.tabs.onActivated.addListener((activeInfo) => {
    void updateBadgeAndTitle(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url === undefined) {
        return // url unchanged, nothing to do
    }

    void updateBadgeAndTitle(tabId)
})

chrome.runtime.onMessage.addListener((message: ActivationMessage, sender) => {
    if (message.msg === 'active' && sender.tab?.id) {
        const state = {
            contentScriptActive: true,
            fakeDate: message.fakeDate,
            tickStartTimestamp: message.tickStartTimestamp,
            timezone: message.timezone,
            isClockStopped: message.isClockStopped,
            fakeDateActive: true,
        }
        void setBadgeAndTitle(sender.tab.id, state)
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
