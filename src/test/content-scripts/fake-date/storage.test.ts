import { afterEach, describe, expect, it } from 'vitest';
import { getFakeDate, getTickStartTimestamp, getTimezone } from '../../../content-scripts/fake-date/storage';
import { setFakeDate, setTickStartTimestamp } from '../../../util/inject';

//Note: sessionStorage starts empty, so this just sets up the event listener
import '../../../content-scripts/replace-date';

describe('setFakeDate/getFakeDate', () => {
    afterEach(() => {
        setFakeDate('');
    });

    it('returns date if set', () => {
        const dateStr = '2023-01-01T00:00:00.000Z';

        setFakeDate(dateStr);

        expect(getFakeDate()).toBe(dateStr);
    });

    it('returns null if not set', () => {
        expect(getFakeDate()).toBeNull();
    });

    it('returns null for invalid date string', () => {
        setFakeDate('invalid-date');

        expect(getFakeDate()).toBeNull();
    });
});

describe('setTickStartTimestamp/setTickStartTimestamp', () => {
    afterEach(() => {
        setFakeDate('');
        setTickStartTimestamp('');
    });

    it('returns timestamp if set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');
        setTickStartTimestamp('1234');

        expect(getTickStartTimestamp()).toBe(1234);
    });

    it('returns null if fake date not set', () => {
        setTickStartTimestamp('1234');

        expect(getTickStartTimestamp()).toBeNull();
    });

    it('returns null for invalid timestamp', () => {
        setTickStartTimestamp('not an number');

        expect(getTickStartTimestamp()).toBeNull();
    });
});

describe('setTimezone/getTimezone', () => {
    afterEach(() => {
        setFakeDate('');
    });

    it('returns timezone if set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z', 'Europe/London');

        expect(getTimezone()).toBe('Europe/London');
    });

    it('returns null if timezone set to empty string', () => {
        setFakeDate('2023-01-01T00:00:00.000Z', '');

        expect(getTimezone()).toBeNull();
    });

    it('returns null if timezone not set', () => {
        setFakeDate('2023-01-01T00:00:00.000Z');

        expect(getTimezone()).toBeNull();
    });

    it('returns null if fake date not set', () => {
        setFakeDate('', 'Europe/London');

        expect(getTimezone()).toBeNull();
    });
});
