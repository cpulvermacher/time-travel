import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';

/**
 * Makes `Temporal` available as a global for the unit tests, mimicking a browser that ships it.
 *
 * Node 24 does not expose Temporal: V8 has it behind `--harmony-temporal`, which is rejected in
 * NODE_OPTIONS and is not inherited by vitest's worker processes. Enabling the flag at runtime does
 * affect *newly created* realms though, so we take Temporal (and `Date.prototype.toTemporalInstant`)
 * from a fresh vm context.
 *
 * Caveats of this stopgap, both of which disappear once the test runtime ships Temporal natively:
 * - V8's implementation predates the final spec, e.g. `Temporal.Now.timeZoneId()` and
 *   `ZonedDateTime.prototype.timeZoneId` are missing (the draft had `timeZone` instead).
 * - The objects come from another realm, so `toTemporalInstant()` returns an Instant that is not an
 *   `instanceof Temporal.Instant` here. Assert on values instead of on the constructor for it.
 */
export function installTemporalGlobal(): void {
    if (typeof Temporal !== 'undefined') {
        return; // runtime already has it
    }

    try {
        setFlagsFromString('--harmony-temporal');
        const realm = runInNewContext('({ Temporal, Date })') as {
            Temporal: typeof Temporal | undefined;
            Date: DateConstructor;
        };
        if (!realm.Temporal) {
            return;
        }

        globalThis.Temporal = realm.Temporal;

        // toTemporalInstant() only reads the receiver's timestamp, so the cross-realm builtin works
        // on our Date objects as well
        const toTemporalInstant = realm.Date.prototype.toTemporalInstant as (() => unknown) | undefined;
        if (toTemporalInstant && Date.prototype.toTemporalInstant === undefined) {
            Date.prototype.toTemporalInstant = toTemporalInstant as () => Temporal.Instant;
        }
    } catch {
        // no Temporal available; the Temporal tests will fail with a clear ReferenceError
    }
}
