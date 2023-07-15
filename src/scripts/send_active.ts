// gets loaded together with replace_date.ts,  so we know the extension
// is active even in case we don't have `activeTab` permission right now.
// this is necessary in particular when reloading a tab or on navigation

const fakeDate = window.sessionStorage.getItem('timeTravelDate')
if (fakeDate) {
    const tickStartDate = window.sessionStorage.getItem('timeTravelTickStartDate')
    chrome.runtime.sendMessage({
        msg: 'active',
        fakeDate,
        tickStartDate,
        isClockTicking: !!tickStartDate
    })
}
