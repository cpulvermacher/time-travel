import { afterEach, beforeEach, describe, expect, it, test } from 'vitest'
import { setFakeDate } from '../../util/common'

//Note: sessionStorage starts empty, so this just sets up the event listener
import '../../scripts/replace_date'

const testStartDate = new Date()

describe('fake Date', () => {
    afterEach(() => {
        setFakeDate('')
    })

    it('constructor() with actual date', () => {
        const date = new Date()
        expect(date.valueOf()).toBeGreaterThan(testStartDate.valueOf())
    })

    it('constructor() with fake date', () => {
        const fakeDate = '2010-01-01T00:00:00.000Z'
        setFakeDate(fakeDate)
        const date = new Date()
        expect(date.toISOString()).toBe(fakeDate)
    })

    it('now() with actual date', () => {
        const date = Date.now()
        expect(date).toBeGreaterThan(testStartDate.valueOf())
    })

    it('now() with fake date', () => {
        const fakeDate = '1970-01-01T00:00:00.123Z'
        setFakeDate(fakeDate)
        const date = Date.now()
        expect(date).toBe(123)
    })

    test.skip('Date() with actual date', () => {
        const date = Date()
        //1s accuracy
        expect(Date.parse(date) + 1000).toBeGreaterThan(testStartDate.valueOf())
    })

    test.skip('Date() with fake date', () => {
        const fakeDate = '1970-01-01T00:00:00.123Z'
        setFakeDate(fakeDate)

        const dateStr = Date()
        const date = new Date(Date.parse(dateStr))
        expect(date.toISOString()).toBe(fakeDate)
    })


    const values = [undefined, '2010-01-01T00:00:00.000Z']
    values.forEach((fakeDate) => {
        describe(`fake date = ${fakeDate}`, () => {
            let date: Date

            beforeEach(() => {
                if (fakeDate)
                    setFakeDate(fakeDate)
                date = new Date('2021-09-15T12:34:56.789')
            })

            it('constructor(string)', () => {
                date = new Date('2021-09-15T12:34:56.789Z')
                expect(date.toISOString()).toBe('2021-09-15T12:34:56.789Z')
            })

            //tests for all javascript Date methods

            it('getFullYear()', () => {
                expect(date.getFullYear()).toEqual(2021)
            })

            it('getMonth()', () => {
                expect(date.getMonth()).toEqual(8)
            })

            it('getDate()', () => {
                expect(date.getDate()).toEqual(15)
            })

            it('getDay()', () => {
                expect(date.getDay()).toEqual(3)
            })

            it('getHours()', () => {
                expect(date.getHours()).toEqual(12)
            })

            it('getMinutes()', () => {
                expect(date.getMinutes()).toEqual(34)
            })

            it('getSeconds()', () => {
                expect(date.getSeconds()).toEqual(56)
            })

            it('getMilliseconds()', () => {
                expect(date.getMilliseconds()).toEqual(789)
            })

            it('getTime()', () => {
                date = new Date('2021-09-15T12:34:56.789Z')
                expect(date.getTime()).toEqual(1631709296789)
            })

            it('setFullYear()', () => {
                date.setFullYear(2022)
                expect(date.getFullYear()).toEqual(2022)
            })

            it('setMonth()', () => {
                date.setMonth(1)
                expect(date.getMonth()).toEqual(1)
            })

            it('setDate()', () => {
                date.setDate(15)
                expect(date.getDate()).toEqual(15)
            })

            it('setHours()', () => {
                date.setHours(6)
                expect(date.getHours()).toEqual(6)
            })

            it('setMinutes()', () => {
                date.setMinutes(45)
                expect(date.getMinutes()).toEqual(45)
            })

            it('setSeconds()', () => {
                date.setSeconds(30)
                expect(date.getSeconds()).toEqual(30)
            })

            it('setMilliseconds()', () => {
                date.setMilliseconds(123)
                expect(date.getMilliseconds()).toEqual(123)
            })

            it('setTime()', () => {
                date.setTime(1234567890)
                expect(date.getTime()).toEqual(1234567890)
            })
        })
    })

})