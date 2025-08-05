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
        return timezone || undefined
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

    /** Gets timezone offset in minutes from a longOffset string.
     *
     * Example: "GMT+02:00" -> -120
     */
    function getOffsetFromLongOffset(longOffset?: string): number {
        if (!longOffset) {
            return 0
        }
        const match = longOffset.match(/GMT([+-]\d{2}):(\d{2})/)
        if (match) {
            const hours = parseInt(match[1], 10)
            const minutes = parseInt(match[2], 10)
            return -(hours * 60 + minutes)
        }
        return 0
    }

    /** Gets a cached formatter */
    function getFormatterForTimezone(timezone: string | undefined): Intl.DateTimeFormat {
        if (cachedFormatterForTimezone === timezone && cachedFormatter !== null) {
            return cachedFormatter
        }
        cachedFormatterForTimezone = timezone
        cachedFormatter = new OriginalIntlDateTimeFormat('en-US', {
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
            timeZone: timezone,
        })
        return cachedFormatter
    }

    function formatToPartsWithTimezone(
        date: Date,
        timezone: string | undefined
    ): Record<Intl.DateTimeFormatPartTypes, string> | undefined {
        const formatter = getFormatterForTimezone(timezone)
        try {
            const parts = formatter.formatToParts(date)
            const partsMap = {} as Record<Intl.DateTimeFormatPartTypes, string>
            parts.forEach((part) => {
                partsMap[part.type] = part.value
            })
            return partsMap
        } catch {
            return undefined
        }
    }

    /** Returns timezone name for toString()/toTimeString(). */
    function getTimezoneName(date: Date, timezone: string | undefined): string {
        const formatter = new OriginalIntlDateTimeFormat('en-US', {
            timeZoneName: 'long', // technically the format is implementation defined, but Chrome, Firefox and node seem to follow this
            timeZone: timezone,
        })

        try {
            const parts = formatter.formatToParts(date)
            const timeZonePart = parts.find((part) => part.type === 'timeZoneName')
            return timeZonePart ? timeZonePart.value : ''
        } catch {
            return ''
        }
    }

    let cachedFormatter: Intl.DateTimeFormat | null = null
    let cachedFormatterForTimezone: string | undefined | null = null

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

        patchDateMethods(returnDate)

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
    function patchDateMethods(dateObj: Date): void {
        // Store original methods to be used later
        const originalToLocaleString = dateObj.toLocaleString.bind(dateObj)
        const originalToLocaleDateString = dateObj.toLocaleDateString.bind(dateObj)
        const originalToLocaleTimeString = dateObj.toLocaleTimeString.bind(dateObj)

        // --- Override string representation methods ---
        //TODO I should probably use bind() instead of directly assigning the function
        // but then again this might only be an Intl. thing

        // Override toString to use the selected timezone
        dateObj.toString = function () {
            const dateString = this.toDateString()
            const timeString = this.toTimeString()
            if (dateString === 'Invalid Date' || timeString === 'Invalid Date') {
                return 'Invalid Date'
            }

            return `${dateString} ${timeString}`
        }
        dateObj.toDateString = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return 'Invalid Date'
            }

            const monthLabel = shortMonths[parseInt(parts.month, 10) - 1] || parts.month

            return `${parts.weekday} ${monthLabel} ${parts.day} ${parts.year}`
        }
        dateObj.toTimeString = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return 'Invalid Date'
            }

            let offset = parts.timeZoneName.replace(':', '')
            if (offset === 'GMT') {
                offset = 'GMT+0000'
            }
            const tzName = getTimezoneName(this, timezone)

            return `${parts.hour}:${parts.minute}:${parts.second} ${offset} (${tzName})`
        }

        // Override locale string methods to use the selected timezone when no timezone is specified
        dateObj.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                const timezone = getTimezone()
                if (!timezone) {
                    options = { ...(options || {}), timeZone: timezone }
                }
            }
            return originalToLocaleString(locales, options)
        }

        dateObj.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                const timezone = getTimezone()
                if (!timezone) {
                    options = { ...(options || {}), timeZone: timezone }
                }
            }
            return originalToLocaleDateString(locales, options)
        }

        dateObj.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
            if (!options || !options.timeZone) {
                const timezone = getTimezone()
                if (!timezone) {
                    options = { ...(options || {}), timeZone: timezone }
                }
            }
            return originalToLocaleTimeString(locales, options)
        }

        // --- Override local time methods to return values in the selected timezone ---

        dateObj.getHours = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.hour ? parseInt(parts.hour, 10) : 0
        }

        dateObj.getMinutes = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.minute ? parseInt(parts.minute, 10) : 0
        }

        dateObj.getSeconds = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.second ? parseInt(parts.second, 10) : 0
        }

        dateObj.getMilliseconds = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.fractionalSecond ? parseInt(parts.fractionalSecond, 10) : 0
        }

        dateObj.getDate = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.day ? parseInt(parts.day, 10) : 1
        }

        dateObj.getMonth = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            // Month is 1-based in formatToParts but 0-based in Date methods
            return parts.month ? parseInt(parts.month, 10) - 1 : 0
        }

        dateObj.getFullYear = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return parts.year ? parseInt(parts.year, 10) : 0
        }

        dateObj.getDay = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            // Convert weekday name to number (0-6, Sunday-Saturday)
            return weekdays.indexOf(parts.weekday || 'Sun')
        }

        dateObj.getTimezoneOffset = function () {
            const timezone = getTimezone()
            const parts = formatToPartsWithTimezone(this, timezone)
            if (!parts) {
                return NaN
            }

            return getOffsetFromLongOffset(parts.timeZoneName)
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
