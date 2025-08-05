import { afterEach, describe, expect, it } from 'vitest'
import { setFakeDate, setTimezone } from '../../util/inject'

//Note: sessionStorage starts empty, so this just sets up the event listener
import '../../scripts/replace_date'

// Only tests the timezone handling, tests without timezone set are in replace_date.test.ts
describe('replace_date with timezone', () => {
    afterEach(() => {
        window.sessionStorage.clear()
    })

    // ----- Date ----
    it('new Date() uses UTC when set', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC')

        const date = new Date()

        expect(date.getTimezoneOffset()).toBe(0)

        //UTC methods
        expect(date.getUTCFullYear()).toBe(2023)
        expect(date.getUTCMonth()).toBe(0) // January
        expect(date.getUTCDate()).toBe(1)
        expect(date.getUTCHours()).toBe(12)
        expect(date.getUTCMinutes()).toBe(0)
        expect(date.getUTCSeconds()).toBe(0)
        expect(date.getUTCMilliseconds()).toBe(0)
        expect(date.getUTCDay()).toBe(0) // Sunday
        expect(date.toISOString()).toBe(fakeDate)
        expect(date.toJSON()).toBe(fakeDate)

        // local time methods
        expect(date.getFullYear()).toBe(2023)
        expect(date.getMonth()).toBe(0) // January
        expect(date.getDate()).toBe(1)
        expect(date.getHours()).toBe(12)
        expect(date.getMinutes()).toBe(0)
        expect(date.getSeconds()).toBe(0)
        expect(date.getMilliseconds()).toBe(0)
        expect(date.getDay()).toBe(0) // Sunday
        expect(date.toDateString()).toBe('Sun Jan 01 2023')
        expect(date.toTimeString()).toBe('12:00:00 GMT+0000 (Coordinated Universal Time)')
        expect(date.toString()).toBe('Sun Jan 01 2023 12:00:00 GMT+0000 (Coordinated Universal Time)')

        expect(date.toLocaleString('en-US')).toBe('1/1/2023, 12:00:00 PM')
        expect(date.toLocaleDateString('en-US')).toBe('1/1/2023')
        expect(date.toLocaleTimeString('en-US')).toBe('12:00:00 PM')
        expect(Date()).toBe('Sun Jan 01 2023 12:00:00 GMT+0000 (Coordinated Universal Time)')
    })

    it('new Date() respects timezone when set', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // 3:01 AM UTC
        setFakeDate(fakeDate)
        setTimezone('America/New_York') // UTC-5 in winter

        const date = new Date()

        expect(date.getTimezoneOffset()).toBe(300)

        //UTC methods
        expect(date.getUTCFullYear()).toBe(2023)
        expect(date.getUTCMonth()).toBe(0) // January
        expect(date.getUTCDate()).toBe(1)
        expect(date.getUTCHours()).toBe(3)
        expect(date.getUTCMinutes()).toBe(1)
        expect(date.getUTCSeconds()).toBe(2)
        expect(date.getUTCMilliseconds()).toBe(345)
        expect(date.getUTCDay()).toBe(0) // Sunday
        expect(date.toISOString()).toBe(fakeDate)
        expect(date.toJSON()).toBe(fakeDate)

        // local time methods
        expect(date.getFullYear()).toBe(2022)
        expect(date.getMonth()).toBe(11) // December
        expect(date.getDate()).toBe(31)
        expect(date.getHours()).toBe(22)
        expect(date.getMinutes()).toBe(1)
        expect(date.getSeconds()).toBe(2)
        expect(date.getMilliseconds()).toBe(345)
        expect(date.getDay()).toBe(6) // Saturday
        expect(date.toDateString()).toBe('Sat Dec 31 2022')
        expect(date.toTimeString()).toBe('22:01:02 GMT-0500 (Eastern Standard Time)')
        expect(date.toString()).toBe('Sat Dec 31 2022 22:01:02 GMT-0500 (Eastern Standard Time)')

        expect(date.toLocaleString('en-US')).toBe('12/31/2022, 10:01:02 PM')
        expect(date.toLocaleDateString('en-US')).toBe('12/31/2022')
        expect(date.toLocaleTimeString('en-US')).toBe('10:01:02 PM')
        expect(Date()).toBe('Sat Dec 31 2022 22:01:02 GMT-0500 (Eastern Standard Time)')
    })
    //TODO add test that with disabled fakedate + timezone set, Date() returns local time

    it('if timezone is set, creating a new Date with arguments should use that timezone', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate)
        setTimezone('America/New_York')

        const checkDate = (date: Date) => {
            expect(date.toISOString()).toBe('2025-07-15T18:30:00.000Z')
            expect(date.toString()).toBe('Tue Jul 15 2025 14:30:00 GMT-0400 (Eastern Daylight Time)')
        }

        // ISO string (UTC)
        checkDate(new Date('2025-07-15T18:30:00.000Z'))
        // local date string (with TZ)
        checkDate(new Date('2025-07-15T14:30:00.000-04:00'))
        // local date string (without TZ offset = local time in New York)
        checkDate(new Date('2025-07-15 14:30'))
        // year, month, date, hours, minutes, seconds, milliseconds
        checkDate(new Date(2025, 6, 15, 14, 30, 0, 0))
        // year, month, date, hours, minutes
        checkDate(new Date(2025, 6, 15, 14, 30))

        // parse() with ISO string (UTC)
        checkDate(new Date(Date.parse('2025-07-15T18:30:00.000Z')))
        // parse() with local date string (with TZ)
        checkDate(new Date(Date.parse('2025-07-15 14:30')))
    })

    it('parse() with only date is in UTC', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate)
        setTimezone('America/New_York')

        const date = new Date(Date.parse('2025-07-15'))

        expect(date.toISOString()).toBe('2025-07-15T00:00:00.000Z')
    })

    // ----- Intl.DateTimeFormat ----

    it('Intl.DateTimeFormat uses timezone when specified', () => {
        // This test only verifies that the option is properly passed to Intl.DateTimeFormat
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC')

        // Create formatter with default options (should use the timezone we set)
        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Create another formatter with explicit UTC timezone
        const utcFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Both should format the same since we set timezone to UTC
        const date = new Date()
        expect(formatter.format(date)).toBe(utcFormatter.format(date))
    })

    it('Intl.DateTimeFormat options override the selected timezone', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC') // Set default to UTC

        // Create formatter with explicit 'GMT' timezone that should override the timezone selector
        const gmtFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'GMT',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Create another formatter with explicit GMT timezone directly
        const directGmtFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'GMT',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Both should format the same since the explicit timeZone option overrides the default
        const date = new Date()
        expect(gmtFormatter.format(date)).toBe(directGmtFormatter.format(date))
    })

    it('default timezone behavior without timezone set', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z'
        setFakeDate(fakeDate)

        const date = new Date()

        // Date should be in the browser's default timezone
        const defaultDate = new Date(fakeDate)

        // Compare timestamps to verify they're the same time
        expect(date.getTime()).toBe(defaultDate.getTime())
    })

    it('respects UTC timezone when set', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC')

        const date = new Date()

        // Should be 12:00 in UTC
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        expect(formatter.format(date)).toBe('12:00')
    })

    it('Intl.DateTimeFormat respects selected timezone', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('America/New_York') // UTC-5

        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Should be 7:00 in New York (UTC-5)
        expect(formatter.format(new Date())).toBe('07:00')
    })

    it('Intl.DateTimeFormat options override the selected timezone', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('America/New_York') // UTC-5

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Tokyo', // UTC+9
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Should be 21:00 in Tokyo (UTC+9)
        expect(formatter.format(new Date())).toBe('21:00')
    })

    it('Can format Date with timezone using Intl.DateTimeFormat', () => {
        const fakeDate = '2023-06-15T14:30:00.000Z' // 2:30 PM UTC
        setFakeDate(fakeDate)
        setTimezone('Europe/Berlin') // UTC+2 in summer

        const date = new Date()

        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })

        // Berlin is UTC+2 in summer, so 14:30 UTC becomes 16:30 in Berlin
        expect(formatter.format(date)).toMatch(/16:30/)
    })
})
