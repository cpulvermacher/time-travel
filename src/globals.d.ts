export {}

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
        __timeTravelState?: {
            fakeDate: string | null
            timezone: string | null
            tickStartTimestamp?: number | null
        }
        Date: DateConstructor
        Intl: typeof Intl
    }

    interface Date {
        /** deprecated, but still supported by Chrome and Firefox */
        getYear(): number
    }
}
