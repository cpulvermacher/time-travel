import { getBrowserWindowBounds } from '@/web-ext/browser';

/** title bar + tab strip + toolbar; only for the initial guess, before the popup is positioned */
const FALLBACK_CHROME_HEIGHT = 120;
/** below this the popup is useless, so accept it being cut off instead */
const MIN_HEIGHT = 200;
/** on desktop, extension popups are capped at 600px anyway */
const MAX_HEIGHT = 600;

/**
 * Limit `--popup-max-height` to the part of the popup that is really visible, turning the rest
 * into scrollable content. Browsers draw the popup past the bottom edge of their own window,
 * where a neighbouring window can end up on top of it (tiling window managers on X11), and
 * desktop Firefox even past the screen edge; in both cases it keeps its full logical size, so
 * nothing overflows and the hidden part is simply unreachable.
 */
export async function limitPopupHeight() {
    const bounds = await getBrowserWindowBounds();
    if (!bounds) {
        return; // opened as a full page, which is not height-limited
    }

    const screenTop = window.screen.availTop ?? 0;
    const visibleBottom = Math.min(screenTop + window.screen.availHeight, bounds.bottom);

    const setMaxHeight = (height: number) => {
        const clamped = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));
        document.documentElement.style.setProperty('--popup-max-height', `${clamped}px`);
    };

    setMaxHeight(bounds.bottom - bounds.top - FALLBACK_CHROME_HEIGHT);

    // the popup is positioned only after load; Chrome reports where in `screenY`, Firefox only in
    // `mozInnerScreenY` (`screenY` stays at the browser window's top there)
    const shrinkToFit = () => {
        const top = window.mozInnerScreenY ?? window.screenY;
        const hiddenBelow = Math.max(0, top + window.innerHeight - visibleBottom);
        const hiddenAbove = Math.max(0, screenTop - top); // popups flipped to open upwards
        if (hiddenBelow + hiddenAbove > 0) {
            setMaxHeight(window.innerHeight - hiddenBelow - hiddenAbove);
        }
    };
    window.addEventListener('resize', shrinkToFit);
    // resize events fire while the popup settles, but the final position may arrive without one
    for (const delay of [100, 300, 1000]) {
        setTimeout(shrinkToFit, delay);
    }
}
