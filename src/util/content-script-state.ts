import * as inject from '../util/inject';
import { getActiveTabId, injectFunction, registerContentScript } from './browser';

export type ContentScriptState = {
    contentScriptActive: boolean;
    fakeDate: string | null;
    tickStartTimestamp: string | null;
    timezone: string | null;
    isClockStopped: boolean;
    fakeDateActive: boolean;
};

/** sets & enables fake date, returns whether page needs reload for content script to be injected
 *
 * @param date a valid date to set
 */
export async function setFakeDate(date: Date, timezone?: string): Promise<boolean> {
    if (import.meta.env.DEV) {
        return true;
    }

    if (isNaN(date.getTime())) {
        throw new Error('setFakeDate(): Invalid date');
    }

    const tabId = await getActiveTabId();

    let needsReload = false;
    if (!(await isContentScriptActive(tabId))) {
        await registerContentScript();
        needsReload = true;
    }

    // store UTC time (also avoids issues with `resistFingerprinting` on Firefox)
    const fakeDateUtc = date.toISOString();
    await injectFunction(tabId, inject.setFakeDate, [fakeDateUtc, timezone || '']);

    return needsReload;
}

/** unsets fake date */
export async function disableFakeDate(): Promise<void> {
    if (import.meta.env.DEV) {
        return;
    }

    const tabId = await getActiveTabId();
    await injectFunction(tabId, inject.setFakeDate, ['', '']);
}

/** set clock ticking state. `setClockState(false)` also resets the start time to now. */
export async function setClockState(stopClock: boolean): Promise<void> {
    const tabId = await getActiveTabId();

    const timestamp = stopClock ? '' : new Date().getTime().toString();
    await injectFunction(tabId, inject.setTickStartTimestamp, [timestamp]);
}

export async function isContentScriptActive(tabId: number) {
    return !!(await injectFunction(tabId, inject.isContentScriptActive, ['']));
}

export async function getContentScriptState(tabId: number): Promise<ContentScriptState> {
    const [contentScriptActive, fakeDate, tickStartTimestamp, timezone] = await Promise.all([
        isContentScriptActive(tabId),
        injectFunction(tabId, inject.getFakeDate, ['']),
        injectFunction(tabId, inject.getTickStartTimestamp, ['']),
        injectFunction(tabId, inject.getTimezone, ['']),
    ]);

    return {
        contentScriptActive,
        fakeDate,
        tickStartTimestamp: tickStartTimestamp,
        timezone,
        isClockStopped: contentScriptActive && !!fakeDate && !tickStartTimestamp,
        fakeDateActive: contentScriptActive && !!fakeDate,
    };
}
