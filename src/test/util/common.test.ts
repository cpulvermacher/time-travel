import { describe, expect, it } from 'vitest'
import { formatLocalTime, overwriteDatePart, parseDate } from '../../util/common'

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

    it('converts unix timestamps to string before replacing', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025')
        const timestamp = timePartFrom.getTime().toString()
        const expectedString = formatLocalTime(timePartFrom, { fullPrecision: true }).replace('1970', '2033')
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

describe('formatLocalTime', () => {
    const full = { fullPrecision: true }

    it('formats in correct format', () => {
        expect(formatLocalTime(new Date('2025-02-10 12:34'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2000-01-01 01:01'))).toBe('2000-01-01 01:01')
        expect(formatLocalTime(new Date('2024-12-31 23:59'))).toBe('2024-12-31 23:59')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 00:00'))).toBe('2025-02-10 00:00')
        expect(formatLocalTime(new Date('2025-01-01 00:00'))).toBe('2025-01-01 00:00')
        expect(formatLocalTime(new Date('2005-12-31 23:59'))).toBe('2005-12-31 23:59')
    })

    it('formats dates after 9999 CE correctly', () => {
        expect(formatLocalTime(new Date('10000-02-10 00:00'))).toBe('10000-02-10 00:00')
        expect(formatLocalTime(new Date('10000-02-10 12:34:55.123'))).toBe('10000-02-10 12:34')
        expect(formatLocalTime(new Date('10000-02-10 12:34:55.123'), full)).toBe('10000-02-10 12:34:55.123')
        expect(formatLocalTime(new Date('40000-02-10 00:00'))).toBe('40000-02-10 00:00')
    })

    it('formats dates before 1000 CE correctly', () => {
        expect(formatLocalTime(new Date('0999-02-10 00:00'))).toBe('0999-02-10 00:00')
        expect(formatLocalTime(new Date('0999-02-10 12:34:55.123'))).toBe('0999-02-10 12:34')
        expect(formatLocalTime(new Date('0100-02-10T00:00'))).toBe('0100-02-10 00:00')
        // less than 3 digits require 'T' separator
        // these don't actually work nicely with the UI yet
        expect(formatLocalTime(new Date('0019-02-10T00:00'))).toBe('0019-02-10 00:00')
        expect(formatLocalTime(new Date('0009-02-10T00:00'))).toBe('0009-02-10 00:00')
        expect(formatLocalTime(new Date('0001-02-10T00:00'))).toBe('0001-02-10 00:00')
    })

    it('formats dates before 1 CE correctly', () => {
        // +0000 = 1 BCE in ISO 8601
        expect(formatLocalTime(new Date('0000-02-10T00:00'))).toBe('0000-02-10 00:00')
        // -0001 = 2 BCE needs extra digits to be parsed
        expect(formatLocalTime(new Date('-000001-02-10T00:00'))).toBe('-000001-02-10 00:00')
        expect(formatLocalTime(new Date('-000010-02-10T00:00'))).toBe('-000010-02-10 00:00')
        expect(formatLocalTime(new Date('-000100-02-10T00:00'))).toBe('-000100-02-10 00:00')
        expect(formatLocalTime(new Date('-001000-02-10T00:00'))).toBe('-001000-02-10 00:00')
    })

    it('handles invalid dates', () => {
        expect(formatLocalTime(new Date(''))).toBe('Invalid Date')
        expect(formatLocalTime(new Date('abcdefgh'))).toBe('Invalid Date')
        expect(formatLocalTime(new Date('2025-01-32'))).toBe('Invalid Date')
    })

    it('uses local time', () => {
        const date = new Date('2025-02-13T12:00Z')
        const formattedDate = formatLocalTime(date)
        expect(new Date(formattedDate).getTime()).toBe(date.getTime())
    })

    it('fullPrecision: outputs as much precision as required', () => {
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'), full)).toBe('2025-02-10 12:34:55.123')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'), full)).toBe('2025-02-10 12:34:55')
        expect(formatLocalTime(new Date('2025-02-10 12:34'), full)).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 00:00'), full)).toBe('2025-02-10 00:00')
    })
})

describe('parseDate', () => {
    it('parses various date formats and returns same string', () => {
        expect(parseDate('2025-02-27 12:40')).toBe('2025-02-27 12:40')
        expect(parseDate('2025-02-27')).toBe('2025-02-27')
        expect(parseDate('27 Feb 2025 12:40')).toBe('27 Feb 2025 12:40')
        expect(parseDate('2025-03-30 00:59:55')).toBe('2025-03-30 00:59:55')
        expect(parseDate('2025-04-27T12:40Z')).toBe('2025-04-27T12:40Z')
        expect(parseDate('2025-02-25T12:40:00.120')).toBe('2025-02-25T12:40:00.120')
    })

    it('parses UNIX timestamps', () => {
        expect(parseDate('1731493140025')).toBe('2024-11-13T10:19:00.025Z')
        expect(parseDate('01')).toBe('1970-01-01T00:00:00.001Z')
    })

    it('returns null for invalid dates', () => {
        expect(parseDate('abcdefgh')).toBe(null)
        expect(parseDate('2025-02-32')).toBe(null)
    })

    it('accepts empty string', () => {
        // can be used to clear the fake date
        expect(parseDate('')).toBe('')
    })
})
