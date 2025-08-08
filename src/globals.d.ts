export {}

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
        Date: DateConstructor
        Intl: typeof Intl
    }

    interface Date {
        /** deprecated, but still supported by Chrome and Firefox */
        getYear(): number
    }
}
