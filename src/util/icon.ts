import { m } from '../paraglide/messages';
import { overwriteGetLocale } from '../paraglide/runtime';
import { getActiveTabId, getUILanguage, setBadgeText, setTitle } from './browser';
import { getContentScriptState, type ContentScriptState } from './content-script-state';
import { getTranslationLocale } from './i18n';
import { getTzInfo } from './timezone-info';

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
        const tzInfo = getTzInfo(getUILanguage(), state.fakeDate, state.timezone || undefined);

        let formattedFakeDate = '';
        if (tzInfo) {
            formattedFakeDate = tzInfo.dateString + ' ' + tzInfo.timeString + ' ' + tzInfo.tzName;
            if (tzInfo.isYearWithDst || tzInfo.isOffsetDifferentFromNow) {
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
