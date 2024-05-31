export {}

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
        Date: DateConstructor
        Intl: typeof Intl
    }
}
