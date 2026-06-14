// this content script is injected into the MAIN world, with no isolation
// to avoid polluting the global scope, the bundled version is wrapped in an IIFE

import { debugLog } from '../util/log';
import { FakeDate } from './fake-date/FakeDate';
import { FakeIntlDateTimeFormat } from './fake-date/FakeIntlDateTimeFormat';
import {
    getFakeDate,
    getTimezone,
    persistState,
    UPDATE_STATE_EVENT,
    UPDATE_TICK_EVENT,
    updateState,
    updateTickState,
} from './fake-date/storage';

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
        // biome-ignore lint/suspicious/noGlobalAssign: this is what we came here to do
        Date = FakeDate as DateConstructor;
        Intl.DateTimeFormat = FakeIntlDateTimeFormat as typeof Intl.DateTimeFormat;
    } else {
        debugLog('Time Travel: Disabling');
        // biome-ignore lint/suspicious/noGlobalAssign: this is what we came here to do
        Date = OriginalDate;
        Intl.DateTimeFormat = OriginalIntlDateTimeFormat;
    }
};

if (window.__timeTravelActive) {
    // this can happen if multiple versions of the extension are installed
    debugLog('Time Travel: content script was already injected, aborting.');
} else {
    updateStateAndReplaceDate();
    window.__timeTravelActive = true;
    // state updates are signaled from the ISOLATED world (see util/inject.ts); registering at
    // document_start means these run before any listener the page might add. A tick-only update
    // skips re-running updateStateAndReplaceDate since Date is already replaced (if active).
    document.addEventListener(UPDATE_STATE_EVENT, updateStateAndReplaceDate);
    document.addEventListener(UPDATE_TICK_EVENT, updateTickState);
    // re-persist state before unload so it survives a reload even if the page
    // cleared or blocked sessionStorage (issues #45/#54)
    window.addEventListener('pagehide', persistState);
}
