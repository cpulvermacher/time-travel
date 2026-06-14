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
    }

    interface Date {
        /** deprecated, but still supported by Chrome and Firefox */
        getYear(): number;

        /** alias for getUTCString() */
        toGMTString(): string;
    }
}
