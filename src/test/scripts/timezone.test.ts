import { afterEach, describe, expect, it } from 'vitest'
import { setFakeDate } from '../../util/inject'

//Note: sessionStorage starts empty, so this just sets up the event listener
import '../../scripts/replace_date'

// Only tests the timezone handling, tests without timezone set are in replace_date.test.ts
describe('replace_date with timezone', () => {
    afterEach(() => {
        setFakeDate('')
    })

    // ----- Date ----
    it('new Date() uses UTC when set', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate, 'UTC')

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
        expect(date.getYear()).toBe(123)
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
        const fakeDateTimestamp = new Date(fakeDate).getTime()
        setFakeDate(fakeDate, 'America/New_York') // UTC-5 in winter

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
        expect(date.getTime()).toBe(fakeDateTimestamp)
        expect(+date).toBe(fakeDateTimestamp)

        // local time methods
        expect(date.getFullYear()).toBe(2022)
        expect(date.getYear()).toBe(122)
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

    it('verify timezone is not used if fakedate is disabled', () => {
        //pick a TZ different from the current one
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const timezone = currentTimezone !== 'America/New_York' ? 'America/New_York' : 'America/Los_Angeles'

        // like setFakeDate(), but only set TZ
        const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
        const TIMEZONE_STORAGE_KEY = 'timeTravelTimezone'
        window.sessionStorage.removeItem(FAKE_DATE_STORAGE_KEY)
        window.sessionStorage.setItem(TIMEZONE_STORAGE_KEY, timezone)
        if (window.__timeTravelUpdateState) {
            window.__timeTravelUpdateState()
        }

        //validate TZ did NOT change
        expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(currentTimezone)
    })

    it('if timezone is set, creating a new Date with arguments should use that timezone', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'America/New_York')

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

    it('if timezone is set, creating new Date on DST boundary works (New York)', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'America/New_York')

        const marBeforDst = new Date('2025-03-09 01:59')
        expect(marBeforDst.toString()).toBe('Sun Mar 09 2025 01:59:00 GMT-0500 (Eastern Standard Time)')
        expect(marBeforDst.toISOString()).toBe('2025-03-09T06:59:00.000Z')
        expect(marBeforDst.getTimezoneOffset()).toBe(300) // -5 hours
        const marAfterDst = new Date('2025-03-09 03:00')
        expect(marAfterDst.toString()).toBe('Sun Mar 09 2025 03:00:00 GMT-0400 (Eastern Daylight Time)')
        expect(marAfterDst.toISOString()).toBe('2025-03-09T07:00:00.000Z')
        expect(marAfterDst.getTimezoneOffset()).toBe(240) // -4 hours
        expect(marAfterDst.getTime() - marBeforDst.getTime()).toBe(60 * 1000) // 1 minute difference

        const novBeforeDstEnd = new Date('2025-11-02 01:59')
        expect(novBeforeDstEnd.toString()).toBe('Sun Nov 02 2025 01:59:00 GMT-0400 (Eastern Daylight Time)')
        expect(novBeforeDstEnd.toISOString()).toBe('2025-11-02T05:59:00.000Z')
        expect(novBeforeDstEnd.getTimezoneOffset()).toBe(240) // -4 hours
        const novAfterDstEnd = new Date('2025-11-02 03:00')
        expect(novAfterDstEnd.toString()).toBe('Sun Nov 02 2025 03:00:00 GMT-0500 (Eastern Standard Time)')
        expect(novAfterDstEnd.toISOString()).toBe('2025-11-02T08:00:00.000Z')
        expect(novAfterDstEnd.getTimezoneOffset()).toBe(300) // -5 hours
        expect(novAfterDstEnd.getTime() - novBeforeDstEnd.getTime()).toBe(2 * 60 * 60 * 1000 + 60 * 1000) // 2:01 difference
    })

    it('if timezone is set, creating new Date on DST boundary works (Chatham)', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'Pacific/Chatham') // +12:45, DST +13:45 from September to April

        // DST ends april 6 3:45
        const aprilBeforDstEnd = new Date('2025-04-06 02:00')
        expect(aprilBeforDstEnd.toString()).toBe('Sun Apr 06 2025 02:00:00 GMT+1345 (Chatham Daylight Time)')
        expect(aprilBeforDstEnd.toISOString()).toBe('2025-04-05T12:15:00.000Z')
        expect(aprilBeforDstEnd.getTimezoneOffset()).toBe(-825)
        const aprilAfterDstEnd = new Date('2025-04-06 04:00')
        expect(aprilAfterDstEnd.toString()).toBe('Sun Apr 06 2025 04:00:00 GMT+1245 (Chatham Standard Time)')
        expect(aprilAfterDstEnd.toISOString()).toBe('2025-04-05T15:15:00.000Z')
        expect(aprilAfterDstEnd.getTimezoneOffset()).toBe(-765)
        expect(aprilAfterDstEnd.getTime() - aprilBeforDstEnd.getTime()).toBe(3 * 60 * 60 * 1000) // 3h difference

        // DST starts September 28 2:45
        const septBeforeDst = new Date('2025-09-28 02:44')
        expect(septBeforeDst.toString()).toBe('Sun Sep 28 2025 02:44:00 GMT+1245 (Chatham Standard Time)')
        expect(septBeforeDst.toISOString()).toBe('2025-09-27T13:59:00.000Z')
        expect(septBeforeDst.getTimezoneOffset()).toBe(-765)
        const septAfterDst = new Date(septBeforeDst)
        septAfterDst.setUTCMinutes(septBeforeDst.getUTCMinutes() + 1)
        expect(septAfterDst.toString()).toBe('Sun Sep 28 2025 03:45:00 GMT+1345 (Chatham Daylight Time)')
        expect(septAfterDst.toISOString()).toBe('2025-09-27T14:00:00.000Z')
        expect(septAfterDst.getTimezoneOffset()).toBe(-825)
        expect(septAfterDst.getTime() - septBeforeDst.getTime()).toBe(60 * 1000) // 1min difference
    })

    it('parse adjusts for nonexisting time near DST boundary', () => {
        setFakeDate('2025-03-09T06:59:00.000Z', 'America/New_York')

        // 2:00 does not exist on DST start (spring forward)
        const nonexistentDate = new Date('2025-03-09 02:00')

        // interpreted as the most likely valid time after the DST jump
        expect(nonexistentDate.toString()).toBe('Sun Mar 09 2025 03:00:00 GMT-0400 (Eastern Daylight Time)')
    })

    it('ambiguous dates are resolved using the offset before the transition', () => {
        setFakeDate('2025-03-09T06:59:00.000Z', 'America/New_York')
        // 2025-11-02 01:00 exists twice here, with -4 and -5 hours offset

        //parse using Date constructor
        const ambiguousDate = new Date('2025-11-02 01:00')
        expect(ambiguousDate.toString()).toBe('Sun Nov 02 2025 01:00:00 GMT-0400 (Eastern Daylight Time)')
        expect(ambiguousDate.toISOString()).toBe('2025-11-02T05:00:00.000Z')
        expect(ambiguousDate.getTimezoneOffset()).toBe(240) // -4 hours

        // Date.parse() should use the same logic
        const ambiguousDate2 = new Date(Date.parse('2025-11-02 01:00'))
        expect(ambiguousDate2.toString()).toBe(ambiguousDate.toString())

        // Date constructor with numeric arguments
        const ambiguousDate3 = new Date(2025, 10, 2, 1, 0) // November is month 10
        expect(ambiguousDate3.toString()).toBe(ambiguousDate.toString())

        // setters
        const ambiguousDate4 = new Date('2025-12-01 23:00') //let's start with a -05:00 offset
        ambiguousDate4.setFullYear(2025, 10, 2) // November 2nd
        ambiguousDate4.setHours(1, 0, 0, 0) // 01:00
        expect(ambiguousDate4.toString()).toBe(ambiguousDate.toString())
    })

    it('getTimezoneOffset() returns correct offset for minutes in offset', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set

        setFakeDate(fakeDate, 'America/New_York')
        expect(new Date('2025-07-15 14:30').getTimezoneOffset()).toBe(240) // -4 hours (EDT)

        setFakeDate(fakeDate, 'Pacific/Chatham')
        expect(new Date('2025-07-15 14:30').getTimezoneOffset()).toBe(-765) // -12:45 (Chatham Standard Time)

        setFakeDate(fakeDate, 'UTC')
        expect(new Date('2025-07-15 14:30').getTimezoneOffset()).toBe(0)

        setFakeDate(fakeDate, 'Asia/Kolkata') // +5:30
        expect(new Date('2025-07-15 14:30').getTimezoneOffset()).toBe(-330) // -5:30

        setFakeDate(fakeDate, 'Pacific/Marquesas')
        expect(new Date('2025-07-15 14:30').getTimezoneOffset()).toBe(570) // +9:30
    })

    it('parse() with only date is in UTC', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'America/New_York')

        const checkDate = (date: Date) => {
            expect(date.toISOString()).toBe('2025-07-15T00:00:00.000Z')
        }

        checkDate(new Date('2025-07-15'))
        checkDate(new Date(Date.parse('2025-07-15')))
    })

    it('parse() wih only date with slashes is implementation dependent', () => {
        // Both Chrome and Node parse this format in local time, but Firefox parses it in UTC
        const checkDate = (date: Date) => {
            expect(date.toDateString()).toBe('Tue Jul 15 2025')
            expect(date.getHours()).toBe(0) // 00:00 in local time
            expect(date.getMinutes()).toBe(0)
            expect(date.getSeconds()).toBe(0)
            expect(date.getMilliseconds()).toBe(0)
        }

        // check unmodified Date constructor
        checkDate(new Date('2025/07/15'))
        checkDate(new Date(Date.parse('2025/07/15')))
        checkDate(new Date('07/15/2025'))
        checkDate(new Date(Date.parse('07/15/2025')))

        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'America/New_York')

        // check FakeDate with timezone set
        checkDate(new Date('2025/07/15'))
        checkDate(new Date(Date.parse('2025/07/15')))
        checkDate(new Date('07/15/2025'))
        checkDate(new Date(Date.parse('07/15/2025')))
    })

    it('parse() handles some overflows', () => {
        const fakeDate = '2023-01-01T03:01:02.345Z' // value irrelevant, just needs to be set
        setFakeDate(fakeDate, 'America/New_York')

        const parsedDate = new Date(Date.parse('2025-01-02 24:00:00Z'))

        expect(parsedDate.toISOString()).toBe('2025-01-03T00:00:00.000Z')
    })

    const jan1stUtc = new Date('2024-01-01T00:00:00.000Z')
    it('setFullYear()', () => {
        setFakeDate('2023-06-01 00:00', 'America/New_York')

        const date = new Date(jan1stUtc)
        expect(date.toString()).toBe('Sun Dec 31 2023 19:00:00 GMT-0500 (Eastern Standard Time)')

        date.setFullYear(2023)
        expect(date.toISOString()).toBe('2024-01-01T00:00:00.000Z') // no change
        date.setFullYear(2025)
        expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    })

    it('setMonth()', () => {
        setFakeDate('2023-06-01 00:00', 'America/New_York')

        const date = new Date(jan1stUtc)
        expect(date.toString()).toBe('Sun Dec 31 2023 19:00:00 GMT-0500 (Eastern Standard Time)')

        date.setMonth(0) // January
        expect(date.toString()).toBe('Tue Jan 31 2023 19:00:00 GMT-0500 (Eastern Standard Time)')
        date.setMonth(6) // July
        expect(date.toString()).toBe('Mon Jul 31 2023 19:00:00 GMT-0400 (Eastern Daylight Time)')
        expect(date.toISOString()).toBe('2023-07-31T23:00:00.000Z')
        date.setMonth(12) // Out of range, should set to January next year
        expect(date.toString()).toBe('Wed Jan 31 2024 19:00:00 GMT-0500 (Eastern Standard Time)')

        date.setMonth(3, 15) // April 15th
        expect(date.toString()).toBe('Mon Apr 15 2024 19:00:00 GMT-0400 (Eastern Daylight Time)')
    })

    it('setDate()', () => {
        setFakeDate('2023-06-01 00:00', 'America/New_York')

        const date = new Date(jan1stUtc)
        expect(date.toString()).toBe('Sun Dec 31 2023 19:00:00 GMT-0500 (Eastern Standard Time)')

        date.setDate(1) // 1st of December
        expect(date.toString()).toBe('Fri Dec 01 2023 19:00:00 GMT-0500 (Eastern Standard Time)')
        date.setDate(15) // 15th of December
        expect(date.toString()).toBe('Fri Dec 15 2023 19:00:00 GMT-0500 (Eastern Standard Time)')
        date.setDate(0) // Out of range, should set to last day of previous month
        expect(date.toString()).toBe('Thu Nov 30 2023 19:00:00 GMT-0500 (Eastern Standard Time)')
    })

    it('setHours()', () => {
        setFakeDate('2023-06-01 00:00', 'America/New_York')

        const date = new Date(jan1stUtc)
        expect(date.toString()).toBe('Sun Dec 31 2023 19:00:00 GMT-0500 (Eastern Standard Time)')

        expect(date.getUTCHours()).toBe(0)
        expect(date.getHours()).toBe(19) // 7 PM in New York (UTC-5)

        date.setHours(0, 0, 0, 0)
        expect(date.getHours()).toBe(0)
        expect(date.toString()).toBe('Sun Dec 31 2023 00:00:00 GMT-0500 (Eastern Standard Time)')
        date.setHours(12, 30, 45, 500)
        expect(date.getHours()).toBe(12)
        expect(date.toString()).toBe('Sun Dec 31 2023 12:30:45 GMT-0500 (Eastern Standard Time)')
        expect(date.toISOString()).toBe('2023-12-31T17:30:45.500Z')
    })

    it('setMinutes()', () => {
        setFakeDate('2023-06-01 00:00', 'Pacific/Chatham') // +13:45 (DST)

        const date = new Date(jan1stUtc)
        expect(date.toString()).toBe('Mon Jan 01 2024 13:45:00 GMT+1345 (Chatham Daylight Time)')

        date.setMinutes(0, 30, 2)
        expect(date.toString()).toBe('Mon Jan 01 2024 13:00:30 GMT+1345 (Chatham Daylight Time)')
        expect(date.getMinutes()).toBe(0)
        expect(date.getSeconds()).toBe(30)
        expect(date.getMilliseconds()).toBe(2)

        date.setMinutes(61) // Should roll over to next hour
        expect(date.toString()).toBe('Mon Jan 01 2024 14:01:30 GMT+1345 (Chatham Daylight Time)')
        expect(date.getMinutes()).toBe(1)
        expect(date.getSeconds()).toBe(30)
        expect(date.getMilliseconds()).toBe(2)
    })

    it('setSeconds()', () => {
        setFakeDate('2023-06-01 00:00', 'Pacific/Chatham') // +13:45 (DST)

        const date = new Date(jan1stUtc)

        expect(date.toString()).toBe('Mon Jan 01 2024 13:45:00 GMT+1345 (Chatham Daylight Time)')
        date.setSeconds(0)
        expect(date.getSeconds()).toBe(0)
        expect(date.toString()).toBe('Mon Jan 01 2024 13:45:00 GMT+1345 (Chatham Daylight Time)')
        date.setSeconds(61, 456) // Should roll over to next minute
        expect(date.getSeconds()).toBe(1)
        expect(date.getMilliseconds()).toBe(456)
        expect(date.toString()).toBe('Mon Jan 01 2024 13:46:01 GMT+1345 (Chatham Daylight Time)')
    })

    it('setMilliseconds()', () => {
        setFakeDate('2023-06-01 00:00', 'Pacific/Chatham') // +13:45 (DST)

        const date = new Date(jan1stUtc)

        expect(date.toString()).toBe('Mon Jan 01 2024 13:45:00 GMT+1345 (Chatham Daylight Time)')
        date.setMilliseconds(0)
        expect(date.getMilliseconds()).toBe(0)
        date.setMilliseconds(456)
        expect(date.toString()).toBe('Mon Jan 01 2024 13:45:00 GMT+1345 (Chatham Daylight Time)')
        expect(date.getMilliseconds()).toBe(456)
    })

    it('setters can be used to step over DST transitions', () => {
        setFakeDate('2023-06-01 00:00', 'America/New_York')

        // Standard Time -> DST: adding 1 minute to 1:59 means clock moves forward to 3:00 a.m.
        const marBeforDst = new Date('2025-03-09 01:59')
        const marAfterDst = new Date(marBeforDst)
        marAfterDst.setSeconds(60)
        expect(marAfterDst.getTime() - marBeforDst.getTime()).toBe(60 * 1000)
        expect(marAfterDst.toString()).toBe('Sun Mar 09 2025 03:00:00 GMT-0400 (Eastern Daylight Time)')
        // moving backwards does NOT work here (this matches browser implementation)
        const marBackwards = new Date(marAfterDst)
        marBackwards.setMinutes(-1)
        expect(marBackwards.toString()).toBe('Sun Mar 09 2025 03:59:00 GMT-0400 (Eastern Daylight Time)')

        // DST -> Standard Time: adding 1 minute to 0:59 means clock moves to first 1:00 a.m. (still DST) ...
        const novBeforeDstEnd = new Date('2025-11-02 00:59')
        expect(novBeforeDstEnd.toString()).toBe('Sun Nov 02 2025 00:59:00 GMT-0400 (Eastern Daylight Time)')
        const novFirst1AM = new Date(novBeforeDstEnd)
        novFirst1AM.setSeconds(60)
        expect(novFirst1AM.getTime() - novBeforeDstEnd.getTime()).toBe(60 * 1000)
        expect(novFirst1AM.toString()).toBe('Sun Nov 02 2025 01:00:00 GMT-0400 (Eastern Daylight Time)')

        // ... adding another hour should go to 2:00 a.m. DST (2h ahead)
        const novSecond1AM = new Date(novFirst1AM)
        novSecond1AM.setMinutes(60)
        expect(novSecond1AM.getTime() - novFirst1AM.getTime()).toBe(2 * 60 * 60 * 1000)
        expect(novSecond1AM.toString()).toBe('Sun Nov 02 2025 02:00:00 GMT-0500 (Eastern Standard Time)')

        // moving backwards does NOT work here (should resolve ambiguity by choosing first 1:00 a.m.)
        const novBackByOneHour = new Date(novSecond1AM)
        novBackByOneHour.setMinutes(-60)
        expect(novBackByOneHour.toString()).toBe('Sun Nov 02 2025 01:00:00 GMT-0400 (Eastern Daylight Time)')
        expect(novBackByOneHour).toEqual(novFirst1AM)
        const novBackToStart = new Date(novBackByOneHour)
        novBackToStart.setMinutes(-1)
        expect(novBackToStart).toEqual(novBeforeDstEnd)
    })

    // ----- Intl.DateTimeFormat ----

    it('Intl.DateTimeFormat uses timezone when specified', () => {
        // This test only verifies that the option is properly passed to Intl.DateTimeFormat
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate, 'UTC')

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
        setFakeDate(fakeDate, 'UTC') // Set default to UTC

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
        setFakeDate(fakeDate, 'UTC')

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

    it('respects timezone settings', () => {
        const fakeDate = '1970-03-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate, 'UTC') // Use UTC to ensure consistent results across environments

        const formatted = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        }).format()

        // Should be 12:00 in UTC (not local time)
        expect(formatted).toBe('12:00')
    })

    it('explicit timeZone option overrides timezone setting', () => {
        const fakeDate = '1970-03-01T12:00:00.000Z' // Noon UTC
        setFakeDate(fakeDate, 'America/New_York') // unused

        const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'GMT',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        }).format()

        // GMT should be the same as UTC at noon
        expect(formatted).toBe('12:00')
    })

    it('Can format Date with timezone using Intl.DateTimeFormat', () => {
        const fakeDate = '2023-06-15T14:30:00.000Z' // 2:30 PM UTC
        setFakeDate(fakeDate, 'Europe/Berlin') // UTC+2 in summer

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
