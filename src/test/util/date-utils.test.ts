import { describe, expect, it } from 'vitest'
import {
    formatLocalDate,
    formatLocalTime,
    overwriteDatePart,
    overwriteTimePart,
    parseDate,
    type ValidDate,
} from '../../util/date-utils'

describe('formatLocalDate', () => {
    const full = { fullPrecision: true }

    it('formats in correct format', () => {
        expect(formatLocalDate(new Date('2025-02-10 12:34'))).toBe('2025-02-10 12:34')
        expect(formatLocalDate(new Date('2000-01-01 01:01'))).toBe('2000-01-01 01:01')
        expect(formatLocalDate(new Date('2024-12-31 23:59'))).toBe('2024-12-31 23:59')
        expect(formatLocalDate(new Date('2025-02-10 12:34:55'))).toBe('2025-02-10 12:34')
        expect(formatLocalDate(new Date('2025-02-10 12:34:55.123'))).toBe('2025-02-10 12:34')
        expect(formatLocalDate(new Date('2025-02-10 00:00'))).toBe('2025-02-10 00:00')
        expect(formatLocalDate(new Date('2025-01-01 00:00'))).toBe('2025-01-01 00:00')
        expect(formatLocalDate(new Date('2005-12-31 23:59'))).toBe('2005-12-31 23:59')
    })

    it('formats dates after 9999 CE correctly', () => {
        expect(formatLocalDate(new Date('10000-02-10 00:00'))).toBe('10000-02-10 00:00')
        expect(formatLocalDate(new Date('10000-02-10 12:34:55.123'))).toBe('10000-02-10 12:34')
        expect(formatLocalDate(new Date('10000-02-10 12:34:55.123'), full)).toBe('10000-02-10 12:34:55.123')
        expect(formatLocalDate(new Date('40000-02-10 00:00'))).toBe('40000-02-10 00:00')
    })

    it('formats dates before 1000 CE correctly', () => {
        expect(formatLocalDate(new Date('0999-02-10 00:00'))).toBe('0999-02-10 00:00')
        expect(formatLocalDate(new Date('0999-02-10 12:34:55.123'))).toBe('0999-02-10 12:34')
        expect(formatLocalDate(new Date('0100-02-10T00:00'))).toBe('0100-02-10 00:00')
        // less than 3 digits require 'T' separator
        // these don't actually work nicely with the UI yet
        expect(formatLocalDate(new Date('0019-02-10T00:00'))).toBe('0019-02-10 00:00')
        expect(formatLocalDate(new Date('0009-02-10T00:00'))).toBe('0009-02-10 00:00')
        expect(formatLocalDate(new Date('0001-02-10T00:00'))).toBe('0001-02-10 00:00')
    })

    it('formats dates before 1 CE correctly', () => {
        // +0000 = 1 BCE in ISO 8601
        expect(formatLocalDate(new Date('0000-02-10T00:00'))).toBe('0000-02-10 00:00')
        // -0001 = 2 BCE needs extra digits to be parsed
        expect(formatLocalDate(new Date('-000001-02-10T00:00'))).toBe('-000001-02-10 00:00')
        expect(formatLocalDate(new Date('-000010-02-10T00:00'))).toBe('-000010-02-10 00:00')
        expect(formatLocalDate(new Date('-000100-02-10T00:00'))).toBe('-000100-02-10 00:00')
        expect(formatLocalDate(new Date('-001000-02-10T00:00'))).toBe('-001000-02-10 00:00')
    })

    it('handles invalid dates', () => {
        expect(formatLocalDate(new Date(''))).toBe('Invalid Date')
        expect(formatLocalDate(new Date('abcdefgh'))).toBe('Invalid Date')
        expect(formatLocalDate(new Date('2025-01-32'))).toBe('Invalid Date')
    })

    it('uses local time', () => {
        const date = new Date('2025-02-13T12:00Z')
        const formattedDate = formatLocalDate(date)
        expect(new Date(formattedDate).getTime()).toBe(date.getTime())
    })

    it('fullPrecision: outputs as much precision as required', () => {
        expect(formatLocalDate(new Date('2025-02-10 12:34:55.123'), full)).toBe('2025-02-10 12:34:55.123')
        expect(formatLocalDate(new Date('2025-02-10 12:34:55'), full)).toBe('2025-02-10 12:34:55')
        expect(formatLocalDate(new Date('2025-02-10 12:34'), full)).toBe('2025-02-10 12:34')
        expect(formatLocalDate(new Date('2025-02-10 00:00'), full)).toBe('2025-02-10 00:00')
    })
})

describe('formatLocalTime', () => {
    it('formats in correct format', () => {
        expect(formatLocalTime(new Date('2025-02-10 12:34'))).toBe('12:34')
        expect(formatLocalTime(new Date('2000-01-01 01:01'))).toBe('01:01')
        expect(formatLocalTime(new Date('2024-12-31 23:59'))).toBe('23:59')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'))).toBe('12:34')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'))).toBe('12:34')
        expect(formatLocalTime(new Date('2025-02-10 00:00'))).toBe('00:00')
        expect(formatLocalTime(new Date('2025-01-01 00:00'))).toBe('00:00')
        expect(formatLocalTime(new Date('2005-12-31 23:59'))).toBe('23:59')
        expect(formatLocalTime(new Date('0999-02-10 12:34:55.123'))).toBe('12:34')
        expect(formatLocalTime(new Date('-001000-02-10T13:04'))).toBe('13:04')
    })

    it('handles invalid dates', () => {
        expect(formatLocalTime(new Date(''))).toBe('Invalid Date')
        expect(formatLocalTime(new Date('abcdefgh'))).toBe('Invalid Date')
        expect(formatLocalTime(new Date('2025-01-32'))).toBe('Invalid Date')
    })
})

describe('overwriteDatePart', () => {
    const date = new Date('2033-01-22 00:00')
    it('updates date part while preserving time precision and format', () => {
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34')
        expect(overwriteDatePart('2025-02-10 12:34:00', date)).toBe('2033-01-22 12:34')
        expect(overwriteDatePart('2025-02-10 12:34:10', date)).toBe('2033-01-22 12:34:10')
        expect(overwriteDatePart('2025-02-10 12:34:01', date)).toBe('2033-01-22 12:34:01')
        expect(overwriteDatePart('2025-02-10 12:34Z', date).endsWith('Z')).toBe(false)
        expect(overwriteDatePart('2023-03-25 12:40:00.120', date)).toBe('2033-01-22 12:40:00.120')
    })

    it('includes at least hours and minutes', () => {
        //readds 00:00 local time
        expect(overwriteDatePart('2025-02-10', date)).toBe('2033-01-22 00:00')
        expect(overwriteDatePart('2025-02-10 ', date)).toBe('2033-01-22 00:00')

        expect(overwriteDatePart('2025-02-10 01:00', date)).toBe('2033-01-22 01:00')
        expect(overwriteDatePart('2025-02-10 1:0', date)).toBe('2033-01-22 01:00')
        expect(overwriteDatePart('2025-02-10 1:1', date)).toBe('2033-01-22 01:01')
    })

    it('time part of unix timestamps is lost', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025')
        const timestamp = timePartFrom.getTime().toString()
        const expectedString = '2033-01-22 00:00'
        expect(overwriteDatePart(timestamp, date)).toBe(expectedString)
    })

    it('totally replaces invalid strings', () => {
        expect(overwriteDatePart('abc', date)).toBe('2033-01-22 00:00')
    })

    it('ignores time part of new date', () => {
        const date = new Date('2033-01-22 21:42:56.789')
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34')
    })
})

describe('overwriteTimePart', () => {
    it('updates time part while preserving time precision and format', () => {
        expect(overwriteTimePart('2025-02-10 12:34', 1, 23)).toBe('2025-02-10 01:23')
        expect(overwriteTimePart('2025-02-10 12:34', 23, 45)).toBe('2025-02-10 23:45')
        expect(overwriteTimePart('2025-02-10 12:34', 0, 0)).toBe('2025-02-10 00:00')
        expect(overwriteTimePart('2025-02-10 12:34', 9, 9)).toBe('2025-02-10 09:09')
        expect(overwriteTimePart('2025-02-10 2:4', 9, 9)).toBe('2025-02-10 09:09')
        expect(overwriteTimePart('2025-02-10 0:0', 9, 9)).toBe('2025-02-10 09:09')
        expect(overwriteTimePart('2025-02-10 00:00', 9, 9)).toBe('2025-02-10 09:09')
        expect(overwriteTimePart('2025-02-10 ', 0, 0)).toBe('2025-02-10 00:00')

        expect(overwriteTimePart('2025-02-10 12:34Z', 0, 0).endsWith('Z')).toBe(false)
    })

    it('discards seconds and miliseconds', () => {
        expect(overwriteTimePart('2025-02-10 12:34:01', 12, 34)).toBe('2025-02-10 12:34')
        expect(overwriteTimePart('2025-02-10 12:40:00.120', 12, 40)).toBe('2025-02-10 12:40')

        expect(overwriteTimePart('2025-02-10 01:00', 23.9, 0)).toBe('2025-02-10 23:00')
        expect(overwriteTimePart('2025-02-10 01:00', 23, 0.9)).toBe('2025-02-10 23:00')
    })

    it('handles unix timestamps', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025')
        const timestamp = timePartFrom.getTime().toString()
        const expectedString = '1970-01-22 23:59'
        expect(overwriteTimePart(timestamp, 23, 59)).toBe(expectedString)
    })

    it('totally replaces invalid strings with current date', () => {
        const datePart = formatLocalDate(new Date()).split(' ')[0]

        expect(overwriteTimePart('abc', 0, 0)).toBe(`${datePart} 00:00`)
        expect(overwriteTimePart('abc', 2, 2)).toBe(`${datePart} 02:02`)
    })
})

describe('parseDate', () => {
    it('parses various date formats and returns same string', () => {
        function checkValidDate(dateStr: string) {
            const date = parseDate(dateStr) as ValidDate

            expect(date.isValid).toBe(true)
            expect(date.isReset).toBe(false)
            expect(date.dateString).toBe(dateStr)
            expect(date.date.getTime()).toBe(Date.parse(dateStr))
        }
        checkValidDate('2025-02-27 12:40')
        checkValidDate('2025-02-27')
        checkValidDate('27 Feb 2025 12:40')
        checkValidDate('2025-03-30 00:59:55')
        checkValidDate('2025-04-27T12:40Z')
        checkValidDate('2025-02-25T12:40:00.120')
    })

    it('parses UNIX timestamps', () => {
        const nov2024 = parseDate('1731493140025') as ValidDate

        expect(nov2024.isValid).toBe(true)
        expect(nov2024.isReset).toBe(false)
        expect(nov2024.dateString).toBe('1731493140025')
        expect(nov2024.date.getTime()).toBe(1731493140025)

        const date1970 = parseDate('01') as ValidDate
        expect(date1970.isValid).toBe(true)
        expect(date1970.isReset).toBe(false)
        expect(date1970.date.getTime()).toBe(1)
        expect(date1970.date.getUTCFullYear()).toBe(1970)
        expect(date1970.dateString).toBe('01')

        const date1970b = parseDate('100') as ValidDate
        expect(date1970b.isValid).toBe(true)
        expect(date1970b.isReset).toBe(false)
        expect(date1970b.date.getTime()).toBe(100)
        expect(date1970b.date.getUTCFullYear()).toBe(1970)
        expect(date1970b.dateString).toBe('100')
    })

    it('returns null for invalid dates', () => {
        expect(parseDate('abcdefgh').isValid).toBe(false)
        expect(parseDate('2025-02-32').isValid).toBe(false)
        expect(parseDate('27-02-03').isValid).toBe(false)
        expect(parseDate('15/01/2024').isValid).toBe(false)
        expect(parseDate('2025-01-001ZZ').isValid).toBe(false)
        expect(parseDate('22:30').isValid).toBe(false)
        expect(parseDate('2024-01-15T10:30:00 Z').isValid).toBe(false)
        expect(parseDate('1234567898764212345678').isValid).toBe(false)
    })

    it('accepts empty string', () => {
        // can be used to clear the fake date
        const dateEmpty = parseDate('')
        expect(dateEmpty.isReset).toBe(true)
        expect(dateEmpty.isValid).toBe(false)
        expect(dateEmpty.dateString).toBe('')

        const dateWhitespace = parseDate('   ')
        expect(dateWhitespace.isReset).toBe(true)
        expect(dateWhitespace.isValid).toBe(false)
        expect(dateWhitespace.dateString).toBe('   ')
    })
})
