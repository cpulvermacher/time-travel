declare const __EXT_VERSION__: string
;(() => {
    console.log(`Time Travel: injected content-script (version ${__EXT_VERSION__}) for host ${window.location.host}`)
    if (window['__timeTravelCheckToggle'] !== undefined) {
        // this can happen if multiple versions of the extension are installed
        console.log('Time Travel: content script was already injected, aborting.')
        return
    }

    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    const TICK_START_STORAGE_KEY = 'timeTravelTickStartTimestamp'
    const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone'

    // ==================== helper functions ====================

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

    /** return timezone setting, or undefined to use browser default */
    function getTimezone(): string | undefined {
        const timezone = getFromStorage(TIMEZONE_STORAGE_KEY)
        return timezone !== null ? timezone : undefined
    }

    /** return the current date/time we want the page to see.
     *
     * This will either be the real current time (extension off),
     * or the fake time, stopped or running (extension on).
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

    /** copy all own properties from source to target, except 'constructor'
     *
     * This includes both own properties and symbols, enumerable or not.
     */
    function copyOwnProperties<T extends object>(source: T, target: T): void {
        Reflect.ownKeys(source)
            .filter((key) => key !== 'constructor')
            .forEach((key) => {
                target[key as keyof T] = source[key as keyof T]
            })
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

        const timezone = getTimezone()
        if (timezone) {
            patchDateMethods(returnDate, timezone)
        }

        // for `new SomeClassDerivedFromDate()`, make sure we return something that is an instance of SomeClassDerivedFromDate
        Object.setPrototypeOf(returnDate, new.target.prototype as object)

        return returnDate
    }

    /**
     * Patch Date methods to respect the selected timezone
     * This includes:
     * - String representation methods: toString, toLocaleString, toLocaleDateString, toLocaleTimeString
     * - Local time methods: getHours, getMinutes, getSeconds, etc.
     * - UTC methods (getUTCHours, etc.) remain unaffected
     */
    function patchDateMethods(dateObj: Date, timezone: string): void {
        // Store original methods to be used later
        const originalToLocaleString = dateObj.toLocaleString.bind(dateObj)
        const originalToLocaleDateString = dateObj.toLocaleDateString.bind(dateObj)
        const originalToLocaleTimeString = dateObj.toLocaleTimeString.bind(dateObj)

        // Cache the Intl formatter for the timezone to optimize performance
        const formatter = new OriginalIntlDateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false,
            weekday: 'short',
            timeZoneName: 'longOffset',
            timeZone: timezone, //TODO this isn't properly updated
        })

        // --- Override string representation methods ---

        // Override toString to use the selected timezone
        dateObj.toString = function () {
            const parts = formatter.formatToParts(this)
            const partsMap: Record<string, string> = {}
            parts.forEach((part) => {
                partsMap[part.type] = part.value
            })

            const monthLabel = shortMonths[parseInt(partsMap.month, 10) - 1] || partsMap.month
            const offset = partsMap.timeZoneName.replace(':', '')

            return `${partsMap.weekday} ${monthLabel} ${partsMap.day} ${partsMap.year} ${partsMap.hour}:${partsMap.minute}:${partsMap.second} ${offset}`
        }

        // Override locale string methods to use the selected timezone when no timezone is specified
        dateObj.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                options = { ...(options || {}), timeZone: timezone }
            }
            return originalToLocaleString(locales, options)
        }

        dateObj.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                options = { ...(options || {}), timeZone: timezone }
            }
            return originalToLocaleDateString(locales, options)
        }

        dateObj.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                options = { ...(options || {}), timeZone: timezone }
            }
            return originalToLocaleTimeString(locales, options)
        }

        // --- Override local time methods to return values in the selected timezone ---

        dateObj.getHours = function () {
            const parts = formatter.formatToParts(this)
            const hour = parts.find((p) => p.type === 'hour')?.value
            return hour ? parseInt(hour, 10) : 0
        }

        dateObj.getMinutes = function () {
            const parts = formatter.formatToParts(this)
            const minute = parts.find((p) => p.type === 'minute')?.value
            return minute ? parseInt(minute, 10) : 0
        }

        dateObj.getSeconds = function () {
            const parts = formatter.formatToParts(this)
            const second = parts.find((p) => p.type === 'second')?.value
            return second ? parseInt(second, 10) : 0
        }

        dateObj.getMilliseconds = function () {
            const parts = formatter.formatToParts(this)
            const fraction = parts.find((p) => p.type === 'fractionalSecond')?.value
            return fraction ? parseInt(fraction, 10) : 0
        }

        dateObj.getDate = function () {
            const parts = formatter.formatToParts(this)
            const day = parts.find((p) => p.type === 'day')?.value
            return day ? parseInt(day, 10) : 1
        }

        dateObj.getMonth = function () {
            const parts = formatter.formatToParts(this)
            const month = parts.find((p) => p.type === 'month')?.value
            // Month is 1-based in formatToParts but 0-based in Date methods
            return month ? parseInt(month, 10) - 1 : 0
        }

        dateObj.getFullYear = function () {
            const parts = formatter.formatToParts(this)
            const year = parts.find((p) => p.type === 'year')?.value
            return year ? parseInt(year, 10) : 0
        }

        dateObj.getDay = function () {
            const parts = formatter.formatToParts(this)
            const weekday = parts.find((p) => p.type === 'weekday')?.value
            // Convert weekday name to number (0-6, Sunday-Saturday)
            return weekdays.indexOf(weekday || 'Sun')
        }

        // Note: We don't override UTC methods as they should remain as is
    }
    // static properties
    Object.setPrototypeOf(FakeDate, OriginalDate)
    FakeDate.now = () => new Date().getTime()

    // for instance properties, _copy_ them from the original Date prototype
    // this is necessary for e.g. @date-fns/tz, which iterates over Object.getOwnPropertyNames(Date.prototype)
    // see also https://github.com/cpulvermacher/time-travel/issues/41
    copyOwnProperties(OriginalDate.prototype, FakeDate.prototype)

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

        // Apply custom timezone if set and no explicit timezone in options
        const timezone = getTimezone()
        if (timezone && (!options || !options.timeZone)) {
            options = { ...(options || {}), timeZone: timezone }
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    FakeIntlDateTimeFormat.prototype[Symbol.toStringTag] = 'Intl.DateTimeFormat'

    // static properties
    Object.setPrototypeOf(FakeIntlDateTimeFormat, Intl.DateTimeFormat)

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
