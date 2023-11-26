export { }

declare global {
    interface Window {
        __timeTravelCheckToggle?: () => void
        Date: DateConstructor
        Intl: typeof Intl

        // for firefox. Trying to do non-trivial things with members seems ill-advised
        wrappedJSObject: Window
    }

    // set via vite.config.ts (from env vars set by build.sh)
    const __EXT_VERSION__: string
    const __TARGET__: 'chrome' | 'firefox'
}
