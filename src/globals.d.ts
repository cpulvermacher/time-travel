export {};

declare global {
    interface Window {
        /** set to true once the content script has been injected; used to detect a repeated
         * injection and to report the active state to the popup */
        __timeTravelActive?: boolean;
        /** in-memory copy of the state, refreshed on the `timeTravelStateUpdate` event */
        __timeTravelState?: {
            fakeDate: string;
            timezone: string | null;
            tickStartTimestamp?: number | null;
        };
        Date: DateConstructor;
        Intl: typeof Intl;
        /** Firefox-only: Y coordinate of the viewport's top edge on the screen, in CSS pixels */
        readonly mozInnerScreenY?: number;
    }

    interface Screen {
        /** top edge of the available screen area, in screen coordinates. Non-standard, but
         * supported by Chrome and Firefox; undefined elsewhere */
        readonly availTop?: number;
    }

    interface Date {
        /** deprecated, but still supported by Chrome and Firefox */
        getYear(): number;

        /** alias for getUTCString() */
        toGMTString(): string;
    }
}
