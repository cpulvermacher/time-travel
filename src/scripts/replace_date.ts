declare const __EXT_VERSION__: string

(() => {
    console.log(`injected content-script (version ${__EXT_VERSION__}) for host ${window.location.host}`)
    if (window['__timeTravelCheckToggle'] !== undefined) {
        // this can happen if multiple versions of the extension are installed
        console.log('content script was already injected, aborting.')
        return
    }

    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp'

    // ==================== helper functions ====================

    /** return key from storage, or null if unset */
    function getFromStorage(key: string): string | null {
        try {
            return window.sessionStorage.getItem(key)
        } catch (err) {
            //in sandbox, we might not be able to access sessionStorage
            return null
        }
    }

    /** return tick start time, or null if unset/invalid */
    function getTickStartTimestamp(): number | null {
        const startTimestamp = getFromStorage(TICK_START_STORAGE_KEY)
        if (startTimestamp == null)
            return null

        try {
            return Number.parseInt(startTimestamp)
        } catch (err) {
            return null
        }
    }

    /** return the current date/time we want the page to see.
     *
     * This will either be the real current time (extension off),
     * or the fake time, stopped or ticking (extension on).
     */
    function maybeFakeNowDate(): Date {
        const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY)
        if (fakeDate !== null) {
            const fakeDateObject = new originalDate(fakeDate)
            const startTimestamp = getTickStartTimestamp()
            if (startTimestamp == null) {
                return fakeDateObject
            } else {
                const elapsed = originalDate.now() - startTimestamp
                return new originalDate(fakeDateObject.getTime() + elapsed)
            }
        } else {
            return new originalDate()
        }
    }

    /** set properties  on given prototype */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function addProperties(proto: any, props: object) {
        Reflect.ownKeys(props).forEach(key =>
            Object.defineProperty(proto, key, {
                configurable: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value: (props as any)[key]
            })
        )
    }

    // ==================== Date replacement ====================

    const originalDate = Date
    // Date constructor, needs to be a function to allow both constructing (`new Date()`) and calling without new: `Date()`
    function FakeDate(
        this: Date | void,
        yearOrObject?: number | string | Date,
        monthIndex?: number,
        date?: number,
        hours?: number,
        minutes?: number,
        seconds?: number,
        ms?: number
    ) {
        if (!(this instanceof Date)) { //invoked without 'new'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (new (FakeDate as any)()).toString()
        }

        if (yearOrObject === undefined) {
            return maybeFakeNowDate()
        } else if (monthIndex === undefined) {
            return new originalDate(yearOrObject)
        } else if (date === undefined) {
            return new originalDate(yearOrObject as number, monthIndex)
        } else if (hours === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date)
        } else if (minutes === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours)
        } else if (seconds === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes)
        } else if (ms === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes, seconds)
        } else {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes, seconds, ms)
        }
    }

    FakeDate.prototype = Date.prototype
    FakeDate.prototype.constructor = FakeDate

    //static methods
    FakeDate.parse = Date.parse
    FakeDate.UTC = Date.UTC
    FakeDate.now = () => (new Date()).getTime()

    // ==================== Intl.DateTimeFormat replacement ====================

    const originalIntlDateTimeFormat = Intl.DateTimeFormat

    interface FakeIntlDateTimeFormat extends Intl.DateTimeFormat {
        _originalObject: Intl.DateTimeFormat
    }
    function FakeIntlDateTimeFormat(this: FakeIntlDateTimeFormat | void, locale?: string | string[], options?: Intl.DateTimeFormatOptions) {
        if (!(this instanceof Intl.DateTimeFormat)) { //invoked without 'new'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (new (FakeIntlDateTimeFormat as any)(locale, options))
        }
        this._originalObject = originalIntlDateTimeFormat(locale, options)
        return this
    }

    function format(this: FakeIntlDateTimeFormat, date?: Date) {
        return this._originalObject.format(date ?? maybeFakeNowDate())
    }
    function formatToParts(this: FakeIntlDateTimeFormat, date?: Date | number): Intl.DateTimeFormatPart[] {
        return this._originalObject.formatToParts(date ?? maybeFakeNowDate())
    }
    type RangeDate = Date | number | bigint
    function formatRange(this: FakeIntlDateTimeFormat, startDate: RangeDate, endDate: RangeDate) {
        return this._originalObject.formatRange(startDate, endDate)
    }
    function formatRangeToParts(this: FakeIntlDateTimeFormat, startDate: RangeDate, endDate: RangeDate) {
        return this._originalObject.formatRangeToParts(startDate, endDate)
    }
    function resolvedOptions(this: FakeIntlDateTimeFormat) { return this._originalObject.resolvedOptions() }

    addProperties(FakeIntlDateTimeFormat.prototype, {
        format, formatRange, formatRangeToParts, formatToParts, resolvedOptions,
        [Symbol.toStringTag]: 'Intl.DateTimeFormat',
    })

    //static methods
    FakeIntlDateTimeFormat.supportedLocalesOf = Intl.DateTimeFormat.supportedLocalesOf

    // ==================== toggle logic for FakeDate / FakeIntlDateTimeFormat ====================

    const propagateToIFrame = (iframe: HTMLIFrameElement): void => {
        try {
            if (iframe.contentWindow?.__timeTravelCheckToggle) {
                iframe.contentWindow.__timeTravelCheckToggle()
            } else {
                // no content script injected into this frame, switch Date object manually
                if (iframe.contentWindow) {
                    iframe.contentWindow.Date = Date
                    iframe.contentWindow.Intl.DateTimeFormat = Intl.DateTimeFormat
                }
            }
        } catch (error) {
            // can happen for sandboxed or cross-origin frames
            console.log('failed to access iframe', iframe.src, error)
        }
    }

    const iFrameObserver = new MutationObserver(() => {
        const iframes = document.getElementsByTagName('iframe')
        for (let i = 0; i < iframes.length; i++) {
            propagateToIFrame(iframes[i])
        }
    })

    const timeTravelCheckToggle = () => {
        const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY)
        console.log(`toggling Time Travel (fake date: ${fakeDate})`)
        if (fakeDate != null) {
            // eslint-disable-next-line no-global-assign
            Date = FakeDate as DateConstructor
            Intl.DateTimeFormat = FakeIntlDateTimeFormat as typeof Intl.DateTimeFormat

            // propagate to any iframes that are added later and might not load content script automatically
            // this is needed for the "dynamic content" case in frames.html
            iFrameObserver.observe(document.documentElement, { childList: true, subtree: true })
        } else {
            // eslint-disable-next-line no-global-assign
            Date = originalDate
            Intl.DateTimeFormat = originalIntlDateTimeFormat

            // stop listening for DOM changes
            iFrameObserver.disconnect()
        }

        // also check if we need to update any child iframes
        const iframes = document.getElementsByTagName('iframe')
        for (let i = 0; i < iframes.length; i++) {
            propagateToIFrame(iframes[i])
        }

    }

    timeTravelCheckToggle()

    window['__timeTravelCheckToggle'] = timeTravelCheckToggle
})()