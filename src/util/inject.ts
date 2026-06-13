// all functions here are meant to be injected into the target page.
// They must be self-contained (no imports/closures), since they are serialized for injection.
//
// Except for isContentScriptActive(), they are injected into the ISOLATED world, where
// sessionStorage cannot be tampered with by the page (see issue #54). State updates are
// signaled to the MAIN world content script via a CustomEvent on `document`
// (event name must match UPDATE_STATE_EVENT in content-scripts/fake-date/storage.ts).

export function getFakeDate() {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate';
    return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY);
}

export function getTimezone() {
    const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone';
    return window.sessionStorage.getItem(TIMEZONE_STORAGE_KEY);
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
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
    return window.sessionStorage.getItem(TICK_START_STORAGE_KEY);
}

/** enables clock ticking if nowTimestampStr is non-empty
 *
 * @returns true on success (so the caller can detect silently failing injections)
 */
export function setTickStartTimestamp(nowTimestampStr: string): boolean {
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
    const UPDATE_STATE_EVENT = 'timeTravelStateUpdate';

    if (!nowTimestampStr) {
        window.sessionStorage.removeItem(TICK_START_STORAGE_KEY);
    } else {
        window.sessionStorage.setItem(TICK_START_STORAGE_KEY, nowTimestampStr);
    }

    document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));
    return true;
}

/** must be injected into the MAIN world, where the content script sets the marker */
export function isContentScriptActive() {
    return window.__timeTravelUpdateState !== undefined;
}
