import { describe, expect, it } from 'vitest'

import { getDateParts, getOffsetMinutes } from '../../../scripts/fake-date/date-parts'

// Only tests the timezone handling, tests without timezone set are in replace_date.test.ts
describe('getDateParts', () => {
    it('returns parts for UTC', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC

        const parts = getDateParts(new Date(fakeDate), 'UTC')
        expect(parts).toEqual({
            year: 2023,
            month: 0,
            day: 1,
            hour: 12,
            minute: 0,
            second: 0,
            ms: 0,
            weekday: 'Sun',
            offsetName: 'GMT',
            rawFormat: {
                year: '2023',
                month: '01',
                day: '01',
                hour: '12',
                minute: '00',
                second: '00',
                fractionalSecond: '000',
                weekday: 'Sun',
                timeZoneName: 'GMT',
                literal: ' ',
            },
        })
    })

    it('returns parts for New York', () => {
        const fakeDate = '2023-01-01T12:00:00.000Z' // Noon UTC

        const parts = getDateParts(new Date(fakeDate), 'America/New_York')
        expect(parts).toEqual({
            year: 2023,
            month: 0,
            day: 1,
            hour: 7,
            minute: 0,
            second: 0,
            ms: 0,
            weekday: 'Sun',
            offsetName: 'GMT-05:00',
            rawFormat: {
                year: '2023',
                month: '01',
                day: '01',
                hour: '07',
                minute: '00',
                second: '00',
                fractionalSecond: '000',
                weekday: 'Sun',
                timeZoneName: 'GMT-05:00',
                literal: ' ',
            },
        })
    })

    it('uses 24h date format (0 hours)', () => {
        const fakeDate = '2023-01-01T00:12:34.123-0500'

        const parts = getDateParts(new Date(fakeDate), 'America/New_York')
        expect(parts).toEqual({
            year: 2023,
            month: 0,
            day: 1,
            hour: 0, // 24 in node 18 with en-US locale
            minute: 12,
            second: 34,
            ms: 123,
            weekday: 'Sun',
            offsetName: 'GMT-05:00',
            rawFormat: {
                year: '2023',
                month: '01',
                day: '01',
                hour: '00',
                minute: '12',
                second: '34',
                fractionalSecond: '123',
                weekday: 'Sun',
                timeZoneName: 'GMT-05:00',
                literal: ' ',
            },
        })
    })

    it('uses 24h date format (23 hours)', () => {
        const fakeDate = '2023-01-01T23:12:34.123-0500'

        const parts = getDateParts(new Date(fakeDate), 'America/New_York')
        expect(parts).toEqual({
            year: 2023,
            month: 0,
            day: 1,
            hour: 23,
            minute: 12,
            second: 34,
            ms: 123,
            weekday: 'Sun',
            offsetName: 'GMT-05:00',
            rawFormat: {
                year: '2023',
                month: '01',
                day: '01',
                hour: '23',
                minute: '12',
                second: '34',
                fractionalSecond: '123',
                weekday: 'Sun',
                timeZoneName: 'GMT-05:00',
                literal: ' ',
            },
        })
    })
})

describe('getOffsetMinutes', () => {
    it('returns 0 for UTC', () => {
        expect(getOffsetMinutes('GMT')).toBe(0)
    })

    it('returns correct minute offset', () => {
        expect(getOffsetMinutes('GMT-05:00')).toBe(300)
        expect(getOffsetMinutes('GMT+02:00')).toBe(-120)
        expect(getOffsetMinutes('GMT+00:30')).toBe(-30)
        expect(getOffsetMinutes('GMT+12:45')).toBe(-765)
    })

    it('returns 0 for invalid timezone', () => {
        expect(getOffsetMinutes('abcd')).toBe(0)
        expect(getOffsetMinutes('')).toBe(0)
        expect(getOffsetMinutes(undefined)).toBe(0)
    })
})
