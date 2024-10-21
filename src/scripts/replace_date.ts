declare const __EXT_VERSION__: string
;(() => {
    console.log(`Time Travel: injected content-script (version ${__EXT_VERSION__}) for host ${window.location.host}`)
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
        } catch {
            //in sandbox, we might not be able to access sessionStorage
            return null
        }
    }

    /** return tick start time, or null if unset/invalid */
    function getTickStartTimestamp(): number | null {
        const startTimestamp = getFromStorage(TICK_START_STORAGE_KEY)
        if (startTimestamp === null) {
            return null
        }

        try {
            return Number.parseInt(startTimestamp)
        } catch {
            return null
        }
    }

    /** return the current date/time we want the page to see.
     *
     * This will either be the real current time (extension off),
     * or the fake time, stopped or ticking (extension on).
     */
    function fakeNowDate(): Date {
        const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY)
        if (fakeDate !== null) {
            const fakeDateObject = new OriginalDate(fakeDate)
            const startTimestamp = getTickStartTimestamp()
            if (startTimestamp === null) {
                return fakeDateObject
            } else {
                const elapsed = OriginalDate.now() - startTimestamp
                return new OriginalDate(fakeDateObject.getTime() + elapsed)
            }
        } else {
            return new OriginalDate()
        }
    }

    /** set properties  on given prototype */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function addProperties(proto: any, props: object) {
        Reflect.ownKeys(props).forEach((key) =>
            Object.defineProperty(proto, key, {
                configurable: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value: (props as any)[key],
            })
        )
    }

    // ==================== Date replacement ====================

    const OriginalDate = Date
    // Date constructor, needs to be a function to allow both constructing (`new Date()`) and calling without new: `Date()`
    function FakeDate(...args: unknown[]) {
        if (!new.target) {
            // `Date()` invoked without 'new', return current time string
            return new Date().toString()
        }

        if (args.length === 0) {
            args = [fakeNowDate()]
        }
        // @ts-expect-error: let original Date constructor handle the arguments
        const returnDate = new OriginalDate(...args)

        // for `new SomeClassDerivedFromDate()`, make sure we return something that is an instance of SomeClassDerivedFromDate
        Object.setPrototypeOf(returnDate, new.target.prototype)

        return returnDate
    }
    // static properties
    Object.setPrototypeOf(FakeDate, OriginalDate)
    FakeDate.now = () => new Date().getTime()

    //instance properties
    Object.setPrototypeOf(FakeDate.prototype, OriginalDate.prototype)

    // ==================== Intl.DateTimeFormat replacement ====================

    const OriginalIntlDateTimeFormat = Intl.DateTimeFormat

    interface FakeIntlDateTimeFormat extends Intl.DateTimeFormat {
        _originalObject: Intl.DateTimeFormat
    }
    function FakeIntlDateTimeFormat(
        this: FakeIntlDateTimeFormat,
        locale?: string | string[],
        options?: Intl.DateTimeFormatOptions
    ) {
        if (!new.target) {
            //invoked without 'new'
            return new Intl.DateTimeFormat(locale, options)
        }
        this._originalObject = OriginalIntlDateTimeFormat(locale, options)

        // the native code implementation of these works even if called without a bound `this`, let's emulate that behaviour
        this.format = format.bind(this)
        this.formatToParts = formatToParts.bind(this)
        this.formatRange = formatRange.bind(this)
        this.formatRangeToParts = formatRangeToParts.bind(this)
        this.resolvedOptions = resolvedOptions.bind(this)

        return this
    }

    function format(this: FakeIntlDateTimeFormat, date?: Date) {
        return this._originalObject.format(date ?? fakeNowDate())
    }
    function formatToParts(this: FakeIntlDateTimeFormat, date?: Date | number): Intl.DateTimeFormatPart[] {
        return this._originalObject.formatToParts(date ?? fakeNowDate())
    }
    type RangeDate = Date | number | bigint
    function formatRange(this: FakeIntlDateTimeFormat, startDate: RangeDate, endDate: RangeDate) {
        return this._originalObject.formatRange(startDate, endDate)
    }
    function formatRangeToParts(this: FakeIntlDateTimeFormat, startDate: RangeDate, endDate: RangeDate) {
        return this._originalObject.formatRangeToParts(startDate, endDate)
    }
    function resolvedOptions(this: FakeIntlDateTimeFormat) {
        return this._originalObject.resolvedOptions()
    }

    addProperties(FakeIntlDateTimeFormat.prototype, {
        [Symbol.toStringTag]: 'Intl.DateTimeFormat',
    })

    //static methods
    FakeIntlDateTimeFormat.supportedLocalesOf = Intl.DateTimeFormat.supportedLocalesOf

    // ==================== toggle logic for FakeDate / FakeIntlDateTimeFormat ====================

    const timeTravelCheckToggle = () => {
        const fakeDate = getFromStorage(FAKE_DATE_STORAGE_KEY)
        if (fakeDate !== null) {
            console.log(`Time Travel: Enabling fake date: ${fakeDate}`)
            // eslint-disable-next-line no-global-assign
            Date = FakeDate as DateConstructor
            Intl.DateTimeFormat = FakeIntlDateTimeFormat as typeof Intl.DateTimeFormat
        } else {
            console.log('Time Travel: Disabling')
            // eslint-disable-next-line no-global-assign
            Date = OriginalDate
            Intl.DateTimeFormat = OriginalIntlDateTimeFormat
        }
    }

    timeTravelCheckToggle()

    window['__timeTravelCheckToggle'] = timeTravelCheckToggle
})()
