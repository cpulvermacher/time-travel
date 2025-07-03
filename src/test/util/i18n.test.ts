import { describe, expect, it } from 'vitest'
import { getFirstDayOfWeek } from '../../util/i18n'

describe('getFirstDayOfWeek', () => {
    it('returns Monday where applicable', () => {
        expect(getFirstDayOfWeek('ca')).toBe(1)
        expect(getFirstDayOfWeek('cs')).toBe(1)
        expect(getFirstDayOfWeek('de')).toBe(1)
        expect(getFirstDayOfWeek('de-AT')).toBe(1)
        expect(getFirstDayOfWeek('en-GB')).toBe(1)
        expect(getFirstDayOfWeek('es')).toBe(1)
        expect(getFirstDayOfWeek('fr')).toBe(1)
        expect(getFirstDayOfWeek('it')).toBe(1)
        expect(getFirstDayOfWeek('nl')).toBe(1)
        expect(getFirstDayOfWeek('pl')).toBe(1)
        expect(getFirstDayOfWeek('ru')).toBe(1)
        expect(getFirstDayOfWeek('sv')).toBe(1)
        expect(getFirstDayOfWeek('tr')).toBe(1)
        expect(getFirstDayOfWeek('uk')).toBe(1)
        expect(getFirstDayOfWeek('vi')).toBe(1)
    })

    it('returns Sunday for others', () => {
        expect(getFirstDayOfWeek('en')).toBe(7)
        expect(getFirstDayOfWeek('en-CA')).toBe(7)
        expect(getFirstDayOfWeek('en-US')).toBe(7)
        expect(getFirstDayOfWeek('zh-HK')).toBe(7)
        expect(getFirstDayOfWeek('zh-SG')).toBe(7)
        expect(getFirstDayOfWeek('zh-TW')).toBe(7)

        //check if we're testing actual getWeekInfo support or our fallback
        const locale = new Intl.Locale('en-US')
        const domSupportsGetWeekInfo = 'getWeekInfo' in locale
        if (domSupportsGetWeekInfo) {
            expect(getFirstDayOfWeek('anything-really')).toBe(1)
        } else {
            expect(getFirstDayOfWeek('anything-really')).toBe(7)
        }
    })
})
