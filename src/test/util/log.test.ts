import { afterEach, describe, expect, it, vi } from 'vitest';
import { logDuration, timed } from '@/util/log';

afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
});

describe('timed', () => {
    it('returns the result of the given function', () => {
        expect(timed('label', () => 42)).toBe(42);
    });

    it('calls the function exactly once', () => {
        const fn = vi.fn(() => 'x');

        timed('label', fn);

        expect(fn).toHaveBeenCalledOnce();
    });

    it('logs the label and measured duration', () => {
        vi.useFakeTimers();
        vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValueOnce(112.34);

        timed('doing stuff', () => undefined);

        expect(console.log).toHaveBeenCalledWith('⏱ doing stuff: 12.3ms');
    });

    it('propagates exceptions and logs nothing', () => {
        expect(() =>
            timed('failing', () => {
                throw new Error('boom');
            })
        ).toThrow('boom');

        expect(console.log).not.toHaveBeenCalled();
    });

    it('does not log in production builds', () => {
        vi.stubEnv('MODE', 'production');

        expect(timed('label', () => 42)).toBe(42);

        expect(console.log).not.toHaveBeenCalled();
    });
});

describe('logDuration', () => {
    it('logs the label with one decimal place', () => {
        logDuration('parsing', 3.1);

        expect(console.log).toHaveBeenCalledWith('⏱ parsing: 3.1ms');
    });

    it('rounds whole numbers to one decimal place', () => {
        logDuration('parsing', 7);

        expect(console.log).toHaveBeenCalledWith('⏱ parsing: 7.0ms');
    });

    it('does not log in production builds', () => {
        vi.stubEnv('MODE', 'production');

        logDuration('parsing', 3.1);

        expect(console.log).not.toHaveBeenCalled();
    });
});
