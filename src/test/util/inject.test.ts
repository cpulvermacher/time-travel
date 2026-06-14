import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setFakeDate, setTickStartTimestamp } from '../../util/inject';

describe('inject writers', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.sessionStorage.clear();
    });

    describe('setFakeDate', () => {
        it('stores date and timezone and dispatches a state update', () => {
            const dispatch = vi.spyOn(document, 'dispatchEvent');

            expect(setFakeDate('2025-01-01T00:00:00.000Z', 'Europe/Berlin')).toBe(true);

            expect(window.sessionStorage.getItem('timeTravelDate')).toBe('2025-01-01T00:00:00.000Z');
            expect(window.sessionStorage.getItem('timeTravelTimezone')).toBe('Europe/Berlin');
            expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'timeTravelStateUpdate' }));
        });

        it('clears stored values for an empty date', () => {
            window.sessionStorage.setItem('timeTravelDate', 'x');
            window.sessionStorage.setItem('timeTravelTimezone', 'Europe/Berlin');

            expect(setFakeDate('', '')).toBe(true);

            expect(window.sessionStorage.getItem('timeTravelDate')).toBeNull();
            expect(window.sessionStorage.getItem('timeTravelTimezone')).toBeNull();
        });

        it('returns false without dispatching when sessionStorage is blocked (sandboxed frame)', () => {
            const setItem = vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
                throw new Error('blocked');
            });
            const dispatch = vi.spyOn(document, 'dispatchEvent');

            try {
                expect(setFakeDate('2025-01-01T00:00:00.000Z')).toBe(false);
                expect(dispatch).not.toHaveBeenCalled();
            } finally {
                setItem.mockRestore();
            }
        });
    });

    describe('setTickStartTimestamp', () => {
        it('stores the timestamp and dispatches a tick update', () => {
            const dispatch = vi.spyOn(document, 'dispatchEvent');

            expect(setTickStartTimestamp('1700000000000')).toBe(true);

            expect(window.sessionStorage.getItem('timeTravelTickStartTimestamp')).toBe('1700000000000');
            expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'timeTravelTickUpdate' }));
        });

        it('returns false without dispatching when sessionStorage is blocked (sandboxed frame)', () => {
            const setItem = vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
                throw new Error('blocked');
            });
            const dispatch = vi.spyOn(document, 'dispatchEvent');

            try {
                expect(setTickStartTimestamp('1700000000000')).toBe(false);
                expect(dispatch).not.toHaveBeenCalled();
            } finally {
                setItem.mockRestore();
            }
        });
    });
});
