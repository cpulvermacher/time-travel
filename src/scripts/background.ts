import { setBadgeAndTitle, updateBadgeAndTitle } from '../util/common'

let browserApi: typeof chrome | typeof browser = chrome
if (__TARGET__ == 'firefox') {
    browserApi = browser
    browserApi.action = browser.browserAction
}

browserApi.tabs.onActivated.addListener((activeInfo) => {
    updateBadgeAndTitle(activeInfo.tabId)
})

browserApi.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url == undefined)
        return // url unchanged, nothing to do

    updateBadgeAndTitle(tabId)
})

if (__TARGET__ != 'firefox') {
    browserApi.runtime.onMessage.addListener((message, sender) => {
        if (message.msg == 'active' && sender.tab?.id) {
            const state = {
                contentScriptActive: true,
                fakeDate: message.fakeDate,
                tickStartTimestamp: message.tickStartTimestamp,
                clockIsRunning: message.isClockTicking,
                fakeDateActive: true
            }
            setBadgeAndTitle(sender.tab.id, state)
        }
    })
}