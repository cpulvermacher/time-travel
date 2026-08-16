import { afterEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_STATE_EVENT, UPDATE_TICK_EVENT } from '@/content-scripts/fake-date/storage';

// Simulates a page where the content script is injected twice, e.g. because multiple versions of
// the extension are installed. The second instance must abort instead of replacing an already
// replaced Date (which would capture FakeDate as its `OriginalDate`).

const abortMessage = 'Time Travel: content script was already injected, aborting.';

describe('re-injection', () => {
    /** simulates one injection of the content script at document_start */
    const injectContentScript = async () => {
        vi.resetModules();
        await import('@/content-scripts/replace-date');
    };

    afterEach(() => {
        window.sessionStorage.clear();
        window.__timeTravelActive = undefined;
        window.__timeTravelState = undefined;
    });

    it('replaces Date if no other instance was injected', async () => {
        vi.spyOn(document, 'addEventListener');
        vi.spyOn(window, 'addEventListener');

        await injectContentScript();

        expect(console.log).not.toHaveBeenCalledWith(abortMessage);
        expect(window.__timeTravelActive).toBe(true);
        expect(document.addEventListener).toHaveBeenCalledWith(UPDATE_STATE_EVENT, expect.any(Function));
        expect(document.addEventListener).toHaveBeenCalledWith(UPDATE_TICK_EVENT, expect.any(Function));
        expect(window.addEventListener).toHaveBeenCalledOnce();
    });

    it('aborts if another instance was already injected', async () => {
        window.__timeTravelActive = true;
        vi.spyOn(document, 'addEventListener');
        vi.spyOn(window, 'addEventListener');

        await injectContentScript();

        expect(console.log).toHaveBeenCalledWith(abortMessage);
        expect(window.__timeTravelActive).toBe(true);
        expect(document.addEventListener).not.toHaveBeenCalled();
        expect(window.addEventListener).not.toHaveBeenCalled();
    });
});
