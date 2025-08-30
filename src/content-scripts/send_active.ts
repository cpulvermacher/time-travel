// gets loaded together with replace_date.ts, so we know the extension
// is active even in case we don't have `activeTab` permission right now.
// this is necessary in particular when reloading a tab or on navigation

import type { ActivationMessage } from '../util/common'

try {
    const fakeDate = window.sessionStorage.getItem('timeTravelDate')
    if (fakeDate) {
        const tickStartTimestamp = window.sessionStorage.getItem('timeTravelTickStartTimestamp')
        const timezone = window.sessionStorage.getItem('timeTravelTimezone')
        void chrome.runtime.sendMessage<ActivationMessage>({
            msg: 'active',
            fakeDate,
            timezone,
            tickStartTimestamp,
            isClockStopped: !tickStartTimestamp,
        })
    }
} catch (exception) {
    //document possibly sandboxed
    console.log('send_active: Reading from sessionStorage was blocked:', exception)
}
