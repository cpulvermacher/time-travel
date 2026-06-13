export {};

declare global {
    interface Window {
        /** updates content script state from session storage */
        __timeTravelUpdateState?: () => void;
        /** state used by content script, updated by __timeTravelUpdateState() */
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
