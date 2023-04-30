// gets loaded together with replace_date.ts,  so we know the extension
// is active even in case we don't have `activeTab` permission right now

if (window.sessionStorage.getItem('timeTravelDate')) {
    chrome.runtime.sendMessage('active')
}
