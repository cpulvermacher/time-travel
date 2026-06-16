import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as browser from '../../util/browser';
import type { ContentScriptState } from '../../util/content-script-state';
import { setIconBadgeAndTitle } from '../../util/icon';

vi.mock('../../util/browser');

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
