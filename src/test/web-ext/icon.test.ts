import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTabState, type TabState } from '@/tab-state/state';
import * as browser from '@/web-ext/browser';
import { setIconBadgeAndTitle, updateExtensionIcon } from '@/web-ext/icon';

vi.mock('@/web-ext/browser');
vi.mock('@/tab-state/state');

beforeEach(() => {
    vi.mocked(browser).getUILanguage.mockReturnValue('en');
});

describe('setIconBadgeAndTitle', () => {
    const activeState: TabState = {
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
        expect(browser.setTitle).toHaveBeenCalledWith(
            1,
            'Time Travel\nJan 1, 2025 9:00 AM Japan Standard Time (+09:00)\nClock stopped'
        );
        expect(console.error).not.toHaveBeenCalled();
    });

    it('says the clock is running if it is not stopped', async () => {
        await setIconBadgeAndTitle(1, { ...activeState, isClockStopped: false });

        expect(browser.setTitle).toHaveBeenCalledWith(
            1,
            'Time Travel\nJan 1, 2025 9:00 AM Japan Standard Time (+09:00)\nClock running'
        );
    });

    it('sets an off title if the content script is active but the date is not faked', async () => {
        await setIconBadgeAndTitle(1, { ...activeState, fakeDateActive: false });

        expect(browser.setBadgeText).toHaveBeenCalledWith(1, '');
        expect(browser.setTitle).toHaveBeenCalledWith(1, 'Time Travel (Off)');
        expect(console.error).not.toHaveBeenCalled();
    });

    it('does not pass an invalid (page-controlled) timezone to Intl', async () => {
        await setIconBadgeAndTitle(1, { ...activeState, timezone: 'Evil/Not_A_Zone' });

        expect(browser.setTitle).toHaveBeenCalled();
        expect(vi.mocked(browser.setTitle).mock.lastCall?.[1]).not.toContain('Evil');
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('updateExtensionIcon', () => {
    const inactiveState: TabState = {
        contentScriptActive: false,
        fakeDate: null,
        tickStartTimestamp: null,
        timezone: null,
        isClockStopped: false,
        fakeDateActive: false,
    };

    beforeEach(() => {
        vi.mocked(getTabState).mockResolvedValue(inactiveState);
    });

    it('uses the given tab id', async () => {
        await updateExtensionIcon(7);

        expect(browser.getActiveTabId).not.toHaveBeenCalled();
        expect(getTabState).toHaveBeenCalledWith(7);
        expect(browser.setBadgeText).toHaveBeenCalledWith(7, '');
    });

    it('falls back to the active tab if no tab id is given', async () => {
        vi.mocked(browser).getActiveTabId.mockResolvedValue(42);

        await updateExtensionIcon();

        expect(getTabState).toHaveBeenCalledWith(42);
        expect(browser.setBadgeText).toHaveBeenCalledWith(42, '');
    });
});
