import { describe, expect, it } from 'vitest'
import { overwriteDatePart, parseDate } from '../../util/common'
import { formatLocalDate } from '../../util/formatLocalDate'

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
        const expectedString = formatLocalDate(timePartFrom, { fullPrecision: true }).replace('1970', '2033')
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
        expect(parseDate('27-02-03')).toBe(null)
        expect(parseDate('15/01/2024')).toBe(null)
        expect(parseDate('2025-01-001ZZ')).toBe(null)
        expect(parseDate('22:30')).toBe(null)
        expect(parseDate('2024-01-15T10:30:00 Z')).toBe(null)
        expect(parseDate('1234567898764212345678')).toBe(null)
    })

    it('accepts empty string', () => {
        // can be used to clear the fake date
        expect(parseDate('')).toBe('')
    })
})
