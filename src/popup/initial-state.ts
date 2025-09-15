/// <reference types="vite/client" />
import { m } from '../paraglide/messages';
import { getActiveTabId, isAboutUrl, isExtensionGalleryUrl, isFileUrl } from '../util/browser';
import { getContentScriptState } from '../util/content-script-state';
import { formatLocalDate, parseDate, parseTimestamp } from '../util/date-utils';
import { loadSettings, type Settings } from '../util/settings';

type InitialState = {
    isEnabled: boolean;
    fakeDate?: string;
    settings: Settings; // stored settings, but possibly overridden by tab state if active
};

/** get current state of extension. Throws on permission errors */
export async function getInitialState(): Promise<InitialState> {
    const settings = await loadSettings();

    if (import.meta.env.DEV) {
        //return dummy state based on settings for testing
        return {
            isEnabled: true,
            fakeDate: '2005-06-07 08:09',
            settings: settings,
        };
    }

    const tabId = await getActiveTabId();
    if (await isAboutUrl(tabId)) {
        // can fail silently on about: URLs, abort early
        throw new Error(m.permission_error_generic());
    }

    try {
        let initialFakeDate;
        const state = await getContentScriptState(tabId);
        if (state.fakeDateActive && state.fakeDate) {
            const fakeDate = parseDate(state.fakeDate);
            const tickStartTimestamp = parseTimestamp(state.tickStartTimestamp);
            if (!fakeDate.isValid) {
                initialFakeDate = undefined;
            } else if (!state.isClockStopped && tickStartTimestamp !== null) {
                const elapsed = Date.now() - tickStartTimestamp;
                const fakeDateNow = new Date(fakeDate.date.getTime() + elapsed);
                initialFakeDate = formatLocalDate(fakeDateNow);
            } else {
                initialFakeDate = formatLocalDate(fakeDate.date, { fullPrecision: true });
            }
        }
        const isEnabled = !!initialFakeDate;

        return {
            isEnabled,
            fakeDate: initialFakeDate,
            settings: {
                autoReload: settings.autoReload,
                advancedSettingsOpen: settings.advancedSettingsOpen,
                stopClock: isEnabled ? state.isClockStopped : settings.stopClock,
                timezone: isEnabled ? state.timezone || '' : settings.timezone,
                recentTimezones: settings.recentTimezones,
            },
        };
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
