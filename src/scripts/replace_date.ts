// this content script is injected into the MAIN world, with no isolation
// to avoid polluting the global scope, the bundled version is wrapped in an IIFE

import { FakeDate } from './fake-date/Date'
import { FakeIntlDateTimeFormat } from './fake-date/DateTimeFormat'
import { getFakeDate } from './fake-date/storage'

declare const __EXT_VERSION__: string
console.log(`Time Travel: injected content-script (version ${__EXT_VERSION__}) for host ${window.location.host}`)

const OriginalDate = Date
const OriginalIntlDateTimeFormat = Intl.DateTimeFormat

const timeTravelCheckToggle = () => {
    const fakeDate = getFakeDate()
    if (fakeDate !== null) {
        console.log(`Time Travel: Enabling fake date: ${fakeDate}`)
        // eslint-disable-next-line no-global-assign
        Date = FakeDate as DateConstructor
        Intl.DateTimeFormat = FakeIntlDateTimeFormat as typeof Intl.DateTimeFormat
    } else {
        console.log('Time Travel: Disabling')
        // eslint-disable-next-line no-global-assign
        Date = OriginalDate
        Intl.DateTimeFormat = OriginalIntlDateTimeFormat
    }
}

if (window['__timeTravelCheckToggle'] !== undefined) {
    // this can happen if multiple versions of the extension are installed
    console.log('Time Travel: content script was already injected, aborting.')
} else {
    timeTravelCheckToggle()
    window['__timeTravelCheckToggle'] = timeTravelCheckToggle
}
