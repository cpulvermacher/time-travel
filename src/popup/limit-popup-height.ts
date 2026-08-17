/** title bar + tab strip + toolbar; only for the initial guess, before the popup is positioned */
const FALLBACK_CHROME_HEIGHT = 120;
const MIN_HEIGHT = 320;

/**
 * Desktop Firefox clips the popup at the screen edge instead of shrinking it to fit; limit
 * `--popup-max-height` to the space actually available. (Chrome constrains the popup natively,
 * and `mozInnerScreenY` is undefined there, making this a no-op.)
 */
export function limitPopupHeight() {
    if (window.mozInnerScreenY === undefined) {
        return;
    }

    const screenTop = window.screen.availTop ?? 0;
    const screenBottom = screenTop + window.screen.availHeight;

    const setMaxHeight = (height: number) => {
        const clamped = Math.min(600, Math.max(MIN_HEIGHT, height));
        document.documentElement.style.setProperty('--popup-max-height', `${clamped}px`);
    };

    setMaxHeight(window.screen.availHeight - FALLBACK_CHROME_HEIGHT);

    // Firefox positions the popup only after load (with resize events firing while it settles),
    // and window.screenY never reflects that; mozInnerScreenY does. Once positioned, shrink the
    // popup by whatever ended up off-screen - this also handles popups flipped to open upwards,
    // where the clipped part is at the top.
    const shrinkToFit = () => {
        const top = window.mozInnerScreenY ?? 0;
        const clippedBelow = Math.max(0, top + window.innerHeight - screenBottom);
        const clippedAbove = Math.max(0, screenTop - top);
        if (clippedBelow + clippedAbove > 0) {
            setMaxHeight(window.innerHeight - clippedBelow - clippedAbove);
        }
    };
    window.addEventListener('resize', shrinkToFit);
    // the final position may arrive without a resize event
    for (const delay of [100, 300, 1000]) {
        setTimeout(shrinkToFit, delay);
    }
}
