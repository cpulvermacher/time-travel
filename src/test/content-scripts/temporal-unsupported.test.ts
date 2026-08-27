import { describe, expect, it, vi } from 'vitest';
import { patchTemporal, unpatchTemporal } from '@/content-scripts/fake-date/FakeTemporal';

// the extension still supports browsers without the Temporal API (Chrome 109), where
// `OriginalTemporal` is null. Faking must then simply skip Temporal instead of failing.
vi.mock('@/date/original-date', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/date/original-date')>()),
    OriginalTemporal: null,
}));

describe('without Temporal support', () => {
    it('patchTemporal() does nothing', () => {
        const original = globalThis.Temporal;
        const originalFormat = original?.Instant.prototype.toLocaleString;

        expect(() => patchTemporal()).not.toThrow();

        expect(globalThis.Temporal).toBe(original);
        expect(original?.Instant.prototype.toLocaleString).toBe(originalFormat);
    });

    it('unpatchTemporal() does nothing', () => {
        const original = globalThis.Temporal;
        const originalFormat = original?.Instant.prototype.toLocaleString;

        expect(() => unpatchTemporal()).not.toThrow();

        expect(globalThis.Temporal).toBe(original);
        expect(original?.Instant.prototype.toLocaleString).toBe(originalFormat);
    });
});
