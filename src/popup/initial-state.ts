/// <reference types="vite/client" />
import { m } from '@/paraglide/messages';
import { type ContentScriptState, getContentScriptState } from '@/util/content-script-state';
import { formatUnambiguousDate } from '@/util/date/format';
import { parseDate, parseTimestamp } from '@/util/date/parse';
import { isValidTimezone } from '@/util/date/timezone-info';
import { getActiveTabId, isAboutUrl, isExtensionGalleryUrl, isFileUrl } from '@/web-ext/browser';
import { loadSettings, type Settings } from '@/web-ext/settings';

/** the fake clock as it is set in the page (see fakeNowDate()), i.e. what the page currently reads */
export type PageClock = {
    date: Date; // fake date stored in the page, i.e. the date the page reads at `tickStart`
    tickStart: number | null; // timestamp the clock started ticking from, null if the clock is stopped
};

export type InitialState = {
    isEnabled: boolean;
    fakeDate: string; // date to show in the picker: current fake date, or current time as fallback
    pageClock: PageClock | undefined; // undefined if no fake date is set in the page
    settings: Settings; // stored settings, but possibly overridden by tab state if active
};

/** map a page-controlled timezone to a valid IANA zone, or '' (browser default) if invalid */
function sanitizeTimezone(timezone: string | null): string {
    return isValidTimezone(timezone) ? timezone : '';
}

/** derive the popup's initial state from the (possibly active) content-script state and stored settings */
function buildInitialState(state: ContentScriptState, settings: Settings): InitialState {
    let initialFakeDate: string | undefined;
    let pageClock: PageClock | undefined;
    const timezone = state.fakeDateActive ? sanitizeTimezone(state.timezone) : settings.timezone;
    if (state.fakeDateActive && state.fakeDate) {
        // note: the stored fake date is an ISO string in UTC, so it is not affected by the time zone
        const fakeDate = parseDate(state.fakeDate);
        const tickStartTimestamp = parseTimestamp(state.tickStartTimestamp);
        if (!fakeDate.isValid) {
            initialFakeDate = undefined;
        } else if (!state.isClockStopped && tickStartTimestamp !== null) {
            const elapsed = Date.now() - tickStartTimestamp;
            const fakeDateNow = new Date(fakeDate.date.getTime() + elapsed);
            initialFakeDate = formatUnambiguousDate(fakeDateNow, timezone);
            pageClock = { date: fakeDate.date, tickStart: tickStartTimestamp };
        } else {
            initialFakeDate = formatUnambiguousDate(fakeDate.date, timezone, { fullPrecision: true });
            pageClock = { date: fakeDate.date, tickStart: null };
        }
    }
    const isEnabled = !!initialFakeDate;

    return {
        isEnabled,
        // fallback: current time, shown in the drafted zone (`timezone` only applies if enabled)
        fakeDate: initialFakeDate ?? formatUnambiguousDate(new Date(), settings.timezone),
        pageClock: isEnabled ? pageClock : undefined,
        settings: {
            autoReload: settings.autoReload,
            advancedSettingsOpen: settings.advancedSettingsOpen,
            stopClock: isEnabled ? state.isClockStopped : settings.stopClock,
            timezone: isEnabled ? timezone : settings.timezone,
            recentTimezones: settings.recentTimezones,
        },
    };
}

/** get current state of extension. Throws on permission errors */
export async function getInitialState(): Promise<InitialState> {
    const settings = await loadSettings();

    if (import.meta.env.DEV) {
        // on the dev server there are no extension APIs; state is mocked in localStorage (see browser.ts /
        // content-script-state.ts), so settings and the active fake date persist across popup reloads
        return buildInitialState(await getContentScriptState(0), settings);
    }

    const tabId = await getActiveTabId();
    if (await isAboutUrl(tabId)) {
        // can fail silently on about: URLs, abort early
        throw new Error(m.permission_error_generic());
    }

    try {
        return buildInitialState(await getContentScriptState(tabId), settings);
    } catch (error) {
        if (await isFileUrl(tabId)) {
            throw new Error(m.permission_error_file_url());
        } else if (await isExtensionGalleryUrl(tabId)) {
            throw new Error(m.permission_error_extension_gallery());
        } else {
            const message = error instanceof Error ? error.message : '';
            throw new Error(m.permission_error_generic_with_message({ message }));
        }
    }
}
