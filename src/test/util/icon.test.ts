import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as browser from '../../util/browser';
import type { ContentScriptState } from '../../util/content-script-state';
import * as contentScriptState from '../../util/content-script-state';
import { setIconBadgeAndTitle, updateExtensionIcon } from '../../util/icon';

vi.mock('../../util/browser');
vi.mock('../../util/content-script-state');

beforeEach(() => {
    vi.mocked(browser).getUILanguage.mockReturnValue('en');
});

describe('setIconBadgeAndTitle', () => {
    const activeState: ContentScriptState = {
        contentScriptActive: true,
        fakeDate: '2025-01-01T00:00:00.000Z',
        tickStartTimestamp: null,
        timezone: 'Asia/Tokyo',
        isClockStopped: true,
        fakeDateActive: true,
    };

    it('sets badge and title for a valid timezone', async () => {
        await setIconBadgeAndTitle(1, activeState);

        expect(browser.setBadgeText).toHaveBeenCalledWith(1, 'ON');
        expect(browser.setTitle).toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it('does not pass an invalid (page-controlled) timezone to Intl', async () => {
        await setIconBadgeAndTitle(1, { ...activeState, timezone: 'Evil/Not_A_Zone' });

        expect(browser.setTitle).toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('updateExtensionIcon', () => {
    const inactiveState: ContentScriptState = {
        contentScriptActive: false,
        fakeDate: null,
        tickStartTimestamp: null,
        timezone: null,
        isClockStopped: false,
        fakeDateActive: false,
    };

    beforeEach(() => {
        vi.mocked(contentScriptState).getContentScriptState.mockResolvedValue(inactiveState);
    });

    it('uses the given tab id', async () => {
        await updateExtensionIcon(7);

        expect(browser.getActiveTabId).not.toHaveBeenCalled();
        expect(contentScriptState.getContentScriptState).toHaveBeenCalledWith(7);
        expect(browser.setBadgeText).toHaveBeenCalledWith(7, '');
    });

    it('falls back to the active tab if no tab id is given', async () => {
        vi.mocked(browser).getActiveTabId.mockResolvedValue(42);

        await updateExtensionIcon();

        expect(contentScriptState.getContentScriptState).toHaveBeenCalledWith(42);
        expect(browser.setBadgeText).toHaveBeenCalledWith(42, '');
    });
});
