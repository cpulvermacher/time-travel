import { fakeNowDate, getTimezone } from './storage'

const OriginalIntlDateTimeFormat = Intl.DateTimeFormat

export interface FakeIntlDateTimeFormat extends Intl.DateTimeFormat {
    _originalObject: Intl.DateTimeFormat
}
export function FakeIntlDateTimeFormat(
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
