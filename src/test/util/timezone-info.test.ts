import { describe, expect, it } from 'vitest'
import { getTzInfo } from '../../util/timezone-info'

describe('getTzInfo', () => {
    it('detects DST for positive offset (Berlin)', () => {
        const timezone = 'Europe/Berlin'

        const winter = getTzInfo('en', '2025-01-01', timezone)
        expect(winter.yearWithDst).toBe(true)
        expect(winter.isDst).toBe(false)
        expect(winter.offset).toBe('+01:00')

        const summer = getTzInfo('en', '2025-07-01', timezone)
        expect(summer.yearWithDst).toBe(true)
        expect(summer.isDst).toBe(true)
        expect(summer.offset).toBe('+02:00')
    })

    it('detects DST for negative offset (New York)', () => {
        const timezone = 'America/New_York'

        const winter = getTzInfo('en', '2025-01-01', timezone)
        expect(winter.yearWithDst).toBe(true)
        expect(winter.isDst).toBe(false)
        expect(winter.offset).toBe('-05:00')

        const summer = getTzInfo('en', '2025-07-01', timezone)
        expect(summer.yearWithDst).toBe(true)
        expect(summer.isDst).toBe(true)
        expect(summer.offset).toBe('-04:00')
    })

    it('detects DST on southern hemisphere (Chatham Islands)', () => {
        const timezone = 'Pacific/Chatham'

        const winter = getTzInfo('en', '2025-07-01', timezone)
        expect(winter.yearWithDst).toBe(true)
        expect(winter.isDst).toBe(false)
        expect(winter.offset).toBe('+12:45')

        const summer = getTzInfo('en', '2025-01-01', timezone)
        expect(summer.yearWithDst).toBe(true)
        expect(summer.isDst).toBe(true)
        expect(summer.offset).toBe('+13:45')
    })

    it('detects timezones without DST (Tokyo)', () => {
        const timezone = 'Asia/Tokyo'

        const info = getTzInfo('en', '2025-07-01', timezone)
        expect(info.yearWithDst).toBe(false)
        expect(info.isDst).toBe(false)
        expect(info.offset).toBe('+09:00')
    })
})
