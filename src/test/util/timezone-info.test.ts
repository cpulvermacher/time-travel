import { describe, expect, it } from 'vitest';
import { getTzInfo } from '../../util/timezone-info';

describe('getTzInfo', () => {
    it('detects DST for positive offset (Berlin)', () => {
        const timezone = 'Europe/Berlin';

        const winter = getTzInfo('en', '2025-01-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('+01:00');

        const summer = getTzInfo('en', '2025-07-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('+02:00');
    });

    it('detects DST for negative offset (New York)', () => {
        const timezone = 'America/New_York';

        const winter = getTzInfo('en', '2025-01-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('-05:00');

        const summer = getTzInfo('en', '2025-07-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('-04:00');
    });

    it('detects DST on southern hemisphere (Chatham Islands)', () => {
        const timezone = 'Pacific/Chatham';

        const winter = getTzInfo('en', '2025-07-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('+12:45');

        const summer = getTzInfo('en', '2025-01-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('+13:45');
    });

    it('detects timezones without DST (Tokyo)', () => {
        const timezone = 'Asia/Tokyo';

        const info = getTzInfo('en', '2025-07-01', timezone)!;
        expect(info.isYearWithDst).toBe(false);
        expect(info.isDst).toBe(false);
        expect(info.offset).toBe('+09:00');
    });

    it('detects if offset is different from now', () => {
        //assuming this test is run after 1972 and these places don't switch back to crazy offsets
        const infoMorovia = getTzInfo('en', '1970-01-01', 'Africa/Monrovia')!;
        expect(infoMorovia.isOffsetDifferentFromNow).toBe(true);
        expect(infoMorovia.offset).toBe('-00:44:30');
        expect(infoMorovia.isYearWithDst).toBe(false);

        const infoDublin = getTzInfo('en', '1910-01-01', 'Europe/Dublin')!;
        expect(infoDublin.isOffsetDifferentFromNow).toBe(true);
        expect(infoDublin.offset).toBe('-00:25:21');
        expect(infoDublin.isYearWithDst).toBe(false);
    });

    it('returns strings in given locale', () => {
        const infoJa = getTzInfo('ja', '2025-07-01T10:00Z', 'America/New_York')!;
        expect(infoJa.dateString).toBe('2025年7月1日');
        expect(infoJa.timeString).toBe('6:00');

        const infoDe = getTzInfo('de', '2025-07-01T10:00Z', 'America/New_York')!;
        expect(infoDe.dateString).toBe('1. Juli 2025');
        expect(infoDe.timeString).toBe('06:00');
    });
});
