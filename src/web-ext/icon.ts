import { getTranslationLocale } from '../display/i18n';
import { getTzInfo, isValidTimezone } from '../display/timezone-info';
import { m } from '../paraglide/messages';
import { overwriteGetLocale } from '../paraglide/runtime';
import { type ContentScriptState, getContentScriptState } from '../util/content-script-state';
import { getActiveTabId, getUILanguage, setBadgeText, setTitle } from './browser';

const defaultTitleText = 'Time Travel';
const devVersion = import.meta.env.VITE_VERSION ? `\nVersion: ${import.meta.env.VITE_VERSION}` : '';

/** Set icon badge and mouseover text based on state of content script in current tab */
export async function setIconBadgeAndTitle(tabId: number, state: ContentScriptState) {
    overwriteGetLocale(() => getTranslationLocale(getUILanguage()));

    let badgeText = '';
    if (state.fakeDateActive) {
        badgeText = 'ON';
    }

    await setBadgeText(tabId, badgeText);

    let title = defaultTitleText;
    if (state.fakeDateActive && state.fakeDate) {
        const timezone = isValidTimezone(state.timezone) ? state.timezone : undefined;
        const tzInfo = getTzInfo(getUILanguage(), state.fakeDate, timezone);

        let formattedFakeDate = '';
        if (tzInfo) {
            formattedFakeDate = tzInfo.dateString + ' ' + tzInfo.timeString + ' ' + tzInfo.tzName;
            if (timezone || tzInfo.isOffsetDifferentFromNow) {
                formattedFakeDate += ` (${tzInfo.offset})`;
            }
        }

        const titleArgs = { fakeDate: formattedFakeDate };
        title += ' ' + (state.isClockStopped ? m.icon_title_stopped(titleArgs) : m.icon_title_running(titleArgs));
    } else if (state.contentScriptActive) {
        title += ' ' + m.icon_title_off();
    }
    title += devVersion;
    await setTitle(tabId, title);
}

export async function updateExtensionIcon(tabId?: number) {
    if (!tabId) {
        tabId = await getActiveTabId();
    }
    const state = await getContentScriptState(tabId);
    await setIconBadgeAndTitle(tabId, state);
}
