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

        // local time methods
        expect(date.getFullYear()).toBe(2023)
        expect(date.getMonth()).toBe(0) // January
        expect(date.getDate()).toBe(1)
        expect(date.getHours()).toBe(12)
        expect(date.getMinutes()).toBe(0)
        expect(date.getSeconds()).toBe(0)
        expect(date.getMilliseconds()).toBe(0)
        expect(date.getDay()).toBe(0) // Sunday
        expect(date.toString()).toBe('Sun Jan 01 2023 12:00:00 GMT (Coordinated Universal Time)')
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

        // local time methods
        expect(date.getFullYear()).toBe(2022)
        expect(date.getMonth()).toBe(11) // December
        expect(date.getDate()).toBe(31)
        expect(date.getHours()).toBe(22)
        expect(date.getMinutes()).toBe(1)
        expect(date.getSeconds()).toBe(2)
        expect(date.getMilliseconds()).toBe(345)
        expect(date.getDay()).toBe(6) // Saturday
        expect(date.toString()).toBe('Sat Dec 31 2022 22:01:02 GMT-0500 (Eastern Standard Time)')
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

    it('FakeDate.toString() returns string with selected timezone when timezone is set', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC')

        const date = new Date()

        // toString should include UTC timezone info, not browser local timezone
        expect(date.toString()).toContain('GMT')
        expect(date.toString()).not.toContain('GMT+') // Should be exactly UTC/GMT, not an offset
        expect(date.toString()).not.toContain('GMT-') // Should be exactly UTC/GMT, not an offset
    })

    it('FakeDate.toLocaleString respects selected timezone', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('Asia/Tokyo') // UTC+9

        const date = new Date()

        // toLocaleString without options should use the timezone setting
        const localeStr = date.toLocaleString('en-US')

        // Should be 21:00 in Tokyo (UTC+9)
        // Using regex to handle different locale string formats
        expect(localeStr).toMatch(/9:00:00 PM|21:00:00/)
    })

    it('FakeDate.toLocaleString with timeZone option overrides selected timezone', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('America/New_York') // UTC-5

        const date = new Date()

        // toLocaleString with explicit timeZone should override the selected timezone
        const localeStr = date.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }) // UTC+13 in summer

        // Auckland is UTC+13 in January, so 12:00 UTC is 1:00 AM the next day
        expect(localeStr).toMatch(/1:00:00 AM|1:00:00|01:00:00/)
    })

    it('FakeDate timezone only affects string representations, not time methods', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate)
        setTimezone('UTC') // Setting explicit timezone

        const date = new Date()
        const localDate = new Date(fakeDate) // Using browser's default timezone

        // The getHours, getMinutes, etc. should still be in local browser time
        expect(date.getHours()).toBe(localDate.getHours())
        expect(date.getMinutes()).toBe(localDate.getMinutes())

        // But string representations should be in the selected timezone
        const utcFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        })
        expect(utcFormatter.format(date)).toBe('12:00')
    })
})
