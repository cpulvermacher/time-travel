import { parseTimestamp } from '../../util/date-utils';

const FAKE_DATE_STORAGE_KEY = 'timeTravelDate';
const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp';
const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone';

const OriginalDate = Date;

export function updateState() {
    const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY);
    if (fakeDate === null || isNaN(Date.parse(fakeDate))) {
        window['__timeTravelState'] = undefined;
        return;
    }

    const timezone = getFromStorage(TIMEZONE_STORAGE_KEY) || null;
    const tickStartTimestamp = parseTimestamp(getFromStorage(TICK_START_STORAGE_KEY));

    window['__timeTravelState'] = {
        fakeDate,
        timezone,
        tickStartTimestamp,
    };
}

/** return key from storage, or null if unset */
function getFromStorage(key: string): string | null {
    try {
        return window.sessionStorage.getItem(key);
    } catch {
        //in sandbox, we might not be able to access sessionStorage
        return null;
    }
}

/** return fake date, or null if unset */
export function getFakeDate(): string | null {
    return window['__timeTravelState']?.fakeDate ?? null;
}

/** return tick start time, or null if unset/invalid */
export function getTickStartTimestamp(): number | null {
    return window['__timeTravelState']?.tickStartTimestamp ?? null;
}

/** return time zone setting, or null to use browser default */
export function getTimezone(): string | null {
    return window['__timeTravelState']?.timezone ?? null;
}

/** return the current date/time we want the page to see.
 *
 * This will either be the real current time (extension off),
 * or the fake time, stopped or running (extension on).
 */
export function fakeNowDate(): Date {
    const fakeDate = getFakeDate();
    if (fakeDate !== null) {
        const fakeDateObject = new OriginalDate(fakeDate);
        const startTimestamp = getTickStartTimestamp();
        if (startTimestamp === null) {
            return fakeDateObject;
        } else {
            const elapsed = OriginalDate.now() - startTimestamp;
            return new OriginalDate(fakeDateObject.getTime() + elapsed);
        }
    } else {
        return new OriginalDate();
    }
}
