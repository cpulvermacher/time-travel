// gets loaded together with replace_date.ts,  so we know the extension
// is active even in case we don't have `activeTab` permission right now.
// this is necessary in particular when reloading a tab or on navigation

const fakeDate = window.sessionStorage.getItem('timeTravelDate')
if (fakeDate) {
    const tickStartTimestamp = window.sessionStorage.getItem('timeTravelTickStartTimestamp')
    chrome.runtime.sendMessage({
        msg: 'active',
        fakeDate,
        tickStartTimestamp,
        isClockTicking: !!tickStartTimestamp
    })
}
