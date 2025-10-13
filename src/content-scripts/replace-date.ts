// this content script is injected into the MAIN world, with no isolation
// to avoid polluting the global scope, the bundled version is wrapped in an IIFE

import { debugLog } from '../util/log';
import { FakeDate } from './fake-date/FakeDate';
import { FakeIntlDateTimeFormat } from './fake-date/FakeIntlDateTimeFormat';
import { getFakeDate, getTimezone, updateState } from './fake-date/storage';

const devVersion = import.meta.env.VITE_VERSION ? `Version: ${import.meta.env.VITE_VERSION}` : '';
debugLog(`Time Travel: injected content-script (${devVersion}) for host ${window.location.host}`);

const OriginalDate = Date;
const OriginalIntlDateTimeFormat = Intl.DateTimeFormat;

const updateStateAndReplaceDate = () => {
    updateState();
    const fakeDate = getFakeDate();
    if (fakeDate !== null) {
        const timezone = getTimezone();
        debugLog(`Time Travel: Enabling fake date: ${fakeDate} (TZ: ${timezone ?? 'browser default'})`);
        // eslint-disable-next-line no-global-assign
        Date = FakeDate as DateConstructor;
        Intl.DateTimeFormat = FakeIntlDateTimeFormat as typeof Intl.DateTimeFormat;
    } else {
        debugLog('Time Travel: Disabling');
        // eslint-disable-next-line no-global-assign
        Date = OriginalDate;
        Intl.DateTimeFormat = OriginalIntlDateTimeFormat;
    }
};

if (window['__timeTravelUpdateState'] !== undefined) {
    // this can happen if multiple versions of the extension are installed
    debugLog('Time Travel: content script was already injected, aborting.');
} else {
    updateStateAndReplaceDate();
    window['__timeTravelUpdateState'] = updateStateAndReplaceDate;
}
