import { describe, expect, it } from 'vitest'
import { formatLocalTime, overwriteDatePart } from '../../util/common'

describe('overwriteDatePart', () => {
    it('updates date part while preserving format if possible', () => {
        const date = new Date('2033-01-22')
        expect(overwriteDatePart('2025-02-10', date)).toBe('2033-01-22')
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34')
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34')
        expect(overwriteDatePart('2025-02-10 12:34Z', date)).toBe('2033-01-22 12:34Z')
        expect(overwriteDatePart('2025-02-10 12:40+1130', date)).toBe('2033-01-22 12:40+1130')
        expect(overwriteDatePart('2023-03-25 12:40:00.120', date)).toBe('2033-01-22 12:40:00.120')
    })

    it('ignores time part of new date', () => {
        const date = new Date('2033-01-22 21:42:56.789')
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34')
    })
})

describe('formatLocalTime', () => {
    it('formats in correct format', () => {
        expect(formatLocalTime(new Date('2025-02-10 12:34'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'))).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 00:00'))).toBe('2025-02-10 00:00')
        expect(formatLocalTime(new Date('2025-01-01 00:00'))).toBe('2025-01-01 00:00')
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
        const options = { fullPrecision: true }
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'), options)).toBe('2025-02-10 12:34:55.123')
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'), options)).toBe('2025-02-10 12:34:55')
        expect(formatLocalTime(new Date('2025-02-10 12:34'), options)).toBe('2025-02-10 12:34')
        expect(formatLocalTime(new Date('2025-02-10 00:00'), options)).toBe('2025-02-10 00:00')
    })
})
