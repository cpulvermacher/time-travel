import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { limitPopupHeight } from '@/popup/limit-popup-height';
import * as browser from '@/web-ext/browser';

vi.mock('@/web-ext/browser');

/** the value the popup ends up limited to, e.g. '214px' (empty string if it was left alone) */
const maxHeight = () => document.documentElement.style.getPropertyValue('--popup-max-height');

/** where the popup ended up on screen, and how tall the browser made it */
function placePopup({ top, height, firefox = false }: { top: number; height: number; firefox?: boolean }) {
    // in Firefox, screenY stays at the browser window's top; only mozInnerScreenY is usable
    setWindowProperty('screenY', firefox ? 22 : top);
    setWindowProperty('mozInnerScreenY', firefox ? top : undefined);
    setWindowProperty('innerHeight', height);
}

function setWindowProperty(name: string, value: number | undefined) {
    Object.defineProperty(window, name, { value, configurable: true, writable: true });
}

/** the part of the screen browser windows can use, i.e. minus any panels at its top and bottom */
function setAvailableScreen({ top, height }: { top?: number; height: number }) {
    Object.defineProperty(window.screen, 'availTop', { value: top, configurable: true });
    Object.defineProperty(window.screen, 'availHeight', { value: height, configurable: true });
}

describe('limitPopupHeight', () => {
    /** resize listeners, captured instead of registered so they can't leak into the next test */
    let resizeListeners: EventListener[] = [];

    beforeEach(() => {
        vi.useFakeTimers();
        document.documentElement.style.removeProperty('--popup-max-height');

        // a 900px screen (1800px at dpr 2) with the browser window in its top half
        setAvailableScreen({ top: 0, height: 900 });
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 22, bottom: 312 });
        placePopup({ top: 98, height: 557 });

        resizeListeners = [];
        vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
            if (type === 'resize') {
                resizeListeners.push(listener as EventListener);
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    /** run limitPopupHeight() and let the popup settle into its final position */
    async function settle() {
        await limitPopupHeight();
        await vi.advanceTimersByTimeAsync(1000);
    }

    it('leaves the height alone when opened as a full page', async () => {
        // no windows API: Firefox for Android, or the dev server
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue(undefined);

        await settle();

        expect(maxHeight()).toBe('');
    });

    it('leaves a fully visible popup at the height guessed from the browser window', async () => {
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 0, bottom: 700 });
        placePopup({ top: 100, height: 400 });

        await settle();

        expect(maxHeight()).toBe('580px'); // nothing is hidden, so the 700px - 120px guess stands
    });

    it('limits the popup to the visible part of its browser window', async () => {
        await settle();

        // the window ends at 312, so only 312 - 98 = 214px of the popup can be seen
        expect(maxHeight()).toBe('214px');
    });

    it('limits the popup to the screen when the window reaches past it', async () => {
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 400, bottom: 1000 });
        placePopup({ top: 500, height: 557 });

        await settle();

        expect(maxHeight()).toBe('400px'); // 900 - 500, i.e. down to the screen edge
    });

    it('keeps a panel at the top of the screen out of the visible area', async () => {
        setAvailableScreen({ top: 40, height: 860 }); // e.g. a task bar, so the screen ends at 900
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 440, bottom: 1000 });
        placePopup({ top: 500, height: 557 });

        await settle();

        expect(maxHeight()).toBe('400px'); // 900 - 500, i.e. down to the screen edge
    });

    it('assumes the screen starts at the top when the browser does not report availTop', async () => {
        setAvailableScreen({ height: 900 });
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 400, bottom: 1000 });
        placePopup({ top: 500, height: 557 });

        await settle();

        expect(maxHeight()).toBe('400px'); // 0 + 900 - 500, i.e. as if availTop were 0
    });

    it('limits a popup flipped to open upwards to the space below the screen top', async () => {
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 600, bottom: 890 });
        placePopup({ top: -50, height: 500 });

        await settle();

        expect(maxHeight()).toBe('450px'); // the top 50px are off-screen
    });

    it('counts the part of a flipped popup hidden behind a panel at the top of the screen', async () => {
        setAvailableScreen({ top: 40, height: 860 });
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 600, bottom: 890 });
        placePopup({ top: 10, height: 500 });

        await settle();

        expect(maxHeight()).toBe('470px'); // the top 30px are behind the panel
    });

    it('never limits the popup to more than the browsers allow anyway', async () => {
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 0, bottom: 890 });
        placePopup({ top: 100, height: 850 });

        await settle();

        expect(maxHeight()).toBe('600px'); // 60px are hidden, but 790px is still past the maximum
    });

    it('uses mozInnerScreenY in Firefox, where screenY is the browser window position', async () => {
        placePopup({ top: 98, height: 557, firefox: true });

        await settle();

        expect(maxHeight()).toBe('214px');
    });

    it('keeps the popup fully visible after it is moved by a resize', async () => {
        await settle();
        placePopup({ top: 250, height: 214 });

        for (const listener of resizeListeners) {
            listener(new Event('resize'));
        }

        expect(maxHeight()).toBe('200px'); // 312 - 250 = 62, raised to the minimum height
    });

    it('measures again later when the final position arrives without a resize event', async () => {
        vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 0, bottom: 700 });
        placePopup({ top: 100, height: 400 });
        await limitPopupHeight();

        await vi.advanceTimersByTimeAsync(100);
        expect(maxHeight()).toBe('580px'); // still where it was opened, and fully visible there

        placePopup({ top: 500, height: 400 });
        await vi.advanceTimersByTimeAsync(900);

        expect(maxHeight()).toBe('200px'); // 700 - 500, without any event announcing the move
    });

    describe('before the popup is positioned', () => {
        it('guesses from the height of the browser window', async () => {
            vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 100, bottom: 600 });

            await limitPopupHeight(); // no timers run yet, so nothing has been measured

            expect(maxHeight()).toBe('380px'); // 500px window, minus its own toolbars
        });

        it('never guesses more than the browsers allow anyway', async () => {
            vi.mocked(browser).getBrowserWindowBounds.mockResolvedValue({ top: 0, bottom: 900 });

            await limitPopupHeight();

            expect(maxHeight()).toBe('600px');
        });

        it('never guesses less than the minimum height', async () => {
            await limitPopupHeight();

            expect(maxHeight()).toBe('200px'); // 290px window - 120px of toolbars = 170px
        });
    });
});
