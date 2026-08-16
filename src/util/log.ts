export const debugLog = (...args: unknown[]) => {
    if (import.meta.env.MODE !== 'production') {
        console.log(...args);
    }
};

/** Runs `fn`, logging how long it took. Only measures in non-production builds. */
export const timed = <T>(label: string, fn: () => T): T => {
    if (import.meta.env.MODE === 'production') {
        return fn();
    }
    const start = performance.now();
    const result = fn();
    logDuration(label, performance.now() - start);
    return result;
};

/** Logs how long something took. Only logs in non-production builds. */
export const logDuration = (label: string, duration: number) => {
    debugLog(`⏱ ${label}: ${duration.toFixed(1)}ms`);
};
