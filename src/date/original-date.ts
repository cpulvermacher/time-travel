/** The native `Date` and `Intl.DateTimeFormat`, captured at module load.
 *
 * In the MAIN world these globals are replaced by `FakeDate` / `FakeIntlDateTimeFormat` (see
 * replace-date.ts), so any code that needs the *real* implementation — creating the underlying date
 * objects, parsing a stored value, reading the true current time — has to go through these instead
 * of the globals.
 *
 * This module is imported (and therefore evaluated) before replace-date.ts performs the swap, so
 * the captured references are always the native ones.
 */
export const OriginalDate = Date;
export const OriginalIntlDateTimeFormat = Intl.DateTimeFormat;
export const OriginalTemporal = typeof Temporal === 'undefined' ? null : Temporal;
