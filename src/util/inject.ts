// all functions here are meant to be injected into the target page.
// They must be self-contained (no imports/closures), since they are serialized for injection.
//
// Readers (getFakeDate/getTimezone/getTickStartTimestamp/isContentScriptActive) run in the
// MAIN world and read the content script's in-memory state (`window.__timeTravelState`), so the
// popup and toolbar icon reflect the active state even after the page clears or blocks
// sessionStorage (issues #45/#54).
//
// Writers (setFakeDate/setTickStartTimestamp) run in the ISOLATED world, where sessionStorage
// cannot be tampered with by the page (see issue #54). After a write they signal the MAIN world
// content script via a CustomEvent on `document` (event names must match the constants in
// content-scripts/fake-date/storage.ts). setFakeDate triggers a full refresh of
// `window.__timeTravelState`; setTickStartTimestamp triggers a tick-only merge, so toggling the
// clock does not drop the fake date if the page had cleared sessionStorage (issue #45).

export function getFakeDate() {
    return window.__timeTravelState?.fakeDate ?? null;
}

export function getTimezone() {
    return window.__timeTravelState?.timezone ?? null;
}

/** sets fake date and timezone and triggers a state update. empty date will disable the fake date
 *
 * @param date date string in ISO format (UTC) or empty string to disable
 * @param timezone IANA time zone string, e.g. "Europe/Berlin" or empty string | undefined to use system timezone
 * @returns true on success (so the caller can detect silently failing injections)
 */
export function setFakeDate(date: string, timezone?: string): boolean {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate';
    const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone';
    const UPDATE_STATE_EVENT = 'timeTravelStateUpdate';

    if (date) {
        window.sessionStorage.setItem(FAKE_DATE_STORAGE_KEY, date);
        if (timezone && timezone.trim() !== '') {
            window.sessionStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
        } else {
            window.sessionStorage.removeItem(TIMEZONE_STORAGE_KEY);
        }
    } else {
        window.sessionStorage.removeItem(FAKE_DATE_STORAGE_KEY);
        window.sessionStorage.removeItem(TIMEZONE_STORAGE_KEY);
    }

    document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));
    return true;
}

export function getTickStartTimestamp(): string | null {
    const tickStartTimestamp = window.__timeTravelState?.tickStartTimestamp;
    return tickStartTimestamp != null ? String(tickStartTimestamp) : null;
}

/** enables clock ticking if nowTimestampStr is non-empty
 *
 * @returns true on success (so the caller can detect silently failing injections)
 */
export function setTickStartTimestamp(nowTimestampStr: string): boolean {
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
    const UPDATE_TICK_EVENT = 'timeTravelTickUpdate';

    if (!nowTimestampStr) {
        window.sessionStorage.removeItem(TICK_START_STORAGE_KEY);
    } else {
        window.sessionStorage.setItem(TICK_START_STORAGE_KEY, nowTimestampStr);
    }

    document.dispatchEvent(new CustomEvent(UPDATE_TICK_EVENT));
    return true;
}

/** must be injected into the MAIN world, where the content script sets the marker */
export function isContentScriptActive() {
    return window.__timeTravelActive === true;
}
