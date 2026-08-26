import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UPDATE_STATE_EVENT } from '@/content-scripts/fake-date/storage';
import { setFakeDate, setTickStartTimestamp } from '@/tab-state/inject';

//Note: sessionStorage starts empty, so this just sets up the event listener
import '@/content-scripts/replace-date';

const testStartDate = new Date();

// fake date without time zone
const fakeDate = '2010-01-01T00:00:00.000Z';
const fakeTimestamp = 1262304000000;

// fake date with time zone: 2022-12-31T22:01:02.345 in New York (UTC-5 in winter)
const fakeDateNy = '2023-01-01T03:01:02.345Z';
const newYork = 'America/New_York';

/** time zone the page currently sees (the faked one if set, the browser default otherwise) */
const pageTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** nothing here applies on an implementation without the Temporal API */
const noTemporal = typeof Temporal === 'undefined';

describe.skipIf(noTemporal)('Temporal', () => {
    afterEach(() => {
        setFakeDate('');
        setTickStartTimestamp('');
        window.sessionStorage.clear();
    });

    describe('Now with fake date off', () => {
        it('instant() returns the actual time', () => {
            const instant = Temporal.Now.instant();

            expect(instant.epochMilliseconds).toBeGreaterThanOrEqual(testStartDate.valueOf());
            expect(instant.epochMilliseconds).toBeLessThanOrEqual(Date.now());
        });

        it('zonedDateTimeISO() returns the actual time in the browser time zone', () => {
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.epochMilliseconds).toBeGreaterThanOrEqual(testStartDate.valueOf());
            expect(zoned.epochMilliseconds).toBeLessThanOrEqual(Date.now());
            expect(zoned.timeZoneId).toBe(pageTimeZone());
        });

        it('plainDateTimeISO() returns the actual date and time', () => {
            const now = new Date();
            const plainDateTime = Temporal.Now.plainDateTimeISO();

            expect(plainDateTime.year).toBe(now.getFullYear());
            expect(plainDateTime.month).toBe(now.getMonth() + 1); // Temporal months are 1-based
            expect(plainDateTime.day).toBe(now.getDate());
            expect(plainDateTime.hour).toBe(now.getHours());
        });

        it('plainDateISO() returns the actual date', () => {
            const now = new Date();
            const plainDate = Temporal.Now.plainDateISO();

            expect(plainDate.year).toBe(now.getFullYear());
            expect(plainDate.month).toBe(now.getMonth() + 1);
            expect(plainDate.day).toBe(now.getDate());
        });

        it('plainTimeISO() returns the actual time', () => {
            const now = new Date();
            const plainTime = Temporal.Now.plainTimeISO();

            expect(plainTime.hour).toBe(now.getHours());
        });

        it('timeZoneId() returns the browser time zone', () => {
            expect(Temporal.Now.timeZoneId()).toBe(pageTimeZone());
        });
    });

    describe('Now with fake date', () => {
        beforeEach(() => {
            setFakeDate(fakeDate);
        });

        it('instant() returns the fake date', () => {
            const instant = Temporal.Now.instant();

            expect(instant.epochMilliseconds).toBe(fakeTimestamp);
            expect(instant.toString()).toBe('2010-01-01T00:00:00Z');
        });

        it('instant() agrees with Date.now()', () => {
            expect(Temporal.Now.instant().epochMilliseconds).toBe(Date.now());
        });

        it('instant() returns a Temporal.Instant', () => {
            expect(Temporal.Now.instant()).toBeInstanceOf(Temporal.Instant);
        });

        it('zonedDateTimeISO() returns the fake date', () => {
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.epochMilliseconds).toBe(fakeTimestamp);
            expect(zoned).toBeInstanceOf(Temporal.ZonedDateTime);
            // without a time zone setting, the browser default is used
            expect(zoned.timeZoneId).toBe(pageTimeZone());
        });

        it('zonedDateTimeISO(timeZone) returns the fake date in the given time zone', () => {
            const zoned = Temporal.Now.zonedDateTimeISO('UTC');

            expect(zoned.toString()).toBe('2010-01-01T00:00:00+00:00[UTC]');
        });

        it('plainDateTimeISO(timeZone) returns the fake date', () => {
            const plainDateTime = Temporal.Now.plainDateTimeISO('UTC');

            expect(plainDateTime.toString()).toBe('2010-01-01T00:00:00');
            expect(plainDateTime).toBeInstanceOf(Temporal.PlainDateTime);
        });

        it('plainDateISO(timeZone) returns the fake date', () => {
            const plainDate = Temporal.Now.plainDateISO('UTC');

            expect(plainDate.toString()).toBe('2010-01-01');
            expect(plainDate).toBeInstanceOf(Temporal.PlainDate);
        });

        it('plainTimeISO(timeZone) returns the fake time', () => {
            const plainTime = Temporal.Now.plainTimeISO('UTC');

            expect(plainTime.toString()).toBe('00:00:00');
            expect(plainTime).toBeInstanceOf(Temporal.PlainTime);
        });

        it('timeZoneId() is unchanged if no time zone is set', () => {
            expect(Temporal.Now.timeZoneId()).toBe(pageTimeZone());
        });

        it('returns the actual time again after turning the fake date off', () => {
            expect(Temporal.Now.instant().epochMilliseconds).toBe(fakeTimestamp);

            setFakeDate('');

            expect(Temporal.Now.instant().epochMilliseconds).toBeGreaterThanOrEqual(testStartDate.valueOf());
            expect(Temporal.Now.instant().epochMilliseconds).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('Now with fake date and time zone', () => {
        beforeEach(() => {
            setFakeDate(fakeDateNy, newYork);
        });

        it('timeZoneId() returns the selected time zone', () => {
            expect(Temporal.Now.timeZoneId()).toBe(newYork);
        });

        it('instant() is not affected by the time zone', () => {
            expect(Temporal.Now.instant().toString()).toBe(fakeDateNy);
        });

        it('zonedDateTimeISO() uses the selected time zone', () => {
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.timeZoneId).toBe(newYork);
            expect(zoned.toString()).toBe('2022-12-31T22:01:02.345-05:00[America/New_York]');
            expect(zoned.offset).toBe('-05:00');
            expect(zoned.year).toBe(2022);
            expect(zoned.month).toBe(12);
            expect(zoned.day).toBe(31);
            expect(zoned.hour).toBe(22);
            expect(zoned.minute).toBe(1);
            expect(zoned.second).toBe(2);
            expect(zoned.millisecond).toBe(345);
            expect(zoned.epochMilliseconds).toBe(Date.parse(fakeDateNy));
        });

        it('plainDateTimeISO() uses the selected time zone', () => {
            expect(Temporal.Now.plainDateTimeISO().toString()).toBe('2022-12-31T22:01:02.345');
        });

        it('plainDateISO() uses the selected time zone', () => {
            expect(Temporal.Now.plainDateISO().toString()).toBe('2022-12-31');
        });

        it('plainTimeISO() uses the selected time zone', () => {
            expect(Temporal.Now.plainTimeISO().toString()).toBe('22:01:02.345');
        });

        it('an explicit time zone argument overrides the selected time zone', () => {
            expect(Temporal.Now.zonedDateTimeISO('UTC').toString()).toBe('2023-01-01T03:01:02.345+00:00[UTC]');
            expect(Temporal.Now.plainDateTimeISO('UTC').toString()).toBe('2023-01-01T03:01:02.345');
            expect(Temporal.Now.plainDateISO('UTC').toString()).toBe('2023-01-01');
            expect(Temporal.Now.plainTimeISO('UTC').toString()).toBe('03:01:02.345');
        });

        it('a ZonedDateTime argument supplies the time zone', () => {
            // the only non-string time zone the original accepts
            const utc = Temporal.ZonedDateTime.from('2021-09-15T12:34:56.789+00:00[UTC]');

            expect(Temporal.Now.zonedDateTimeISO(utc).toString()).toBe('2023-01-01T03:01:02.345+00:00[UTC]');
            expect(Temporal.Now.plainDateTimeISO(utc).toString()).toBe('2023-01-01T03:01:02.345');
            expect(Temporal.Now.plainDateISO(utc).toString()).toBe('2023-01-01');
            expect(Temporal.Now.plainTimeISO(utc).toString()).toBe('03:01:02.345');
        });

        it('time zone is ignored if the fake date is disabled', () => {
            setFakeDate('');
            const browserTimeZone = pageTimeZone();

            // like setFakeDate(), but only set the time zone
            window.sessionStorage.setItem('timeTravelTimezone', newYork);
            document.dispatchEvent(new CustomEvent(UPDATE_STATE_EVENT));

            expect(Temporal.Now.timeZoneId()).toBe(browserTimeZone);
            expect(Temporal.Now.zonedDateTimeISO().timeZoneId).toBe(browserTimeZone);
        });
    });

    // a local time inside a DST fall-back happens twice, so the wall clock alone cannot identify
    // the instant -- Now must stay anchored to the epoch time
    describe('Now during a DST transition', () => {
        // 01:30 in New York happens twice on 2023-11-05: first as EDT, then as EST
        const firstPass = '2023-11-05T05:30:00.000Z';
        const secondPass = '2023-11-05T06:30:00.000Z';

        it('zonedDateTimeISO() returns the first pass through the repeated hour', () => {
            setFakeDate(firstPass, newYork);
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.toString()).toBe('2023-11-05T01:30:00-04:00[America/New_York]');
            expect(zoned.offset).toBe('-04:00');
            expect(zoned.epochMilliseconds).toBe(Date.parse(firstPass));
            expect(zoned.epochMilliseconds).toBe(Temporal.Now.instant().epochMilliseconds);
            expect(zoned.epochMilliseconds).toBe(Date.now());
        });

        it('zonedDateTimeISO() returns the second pass through the repeated hour', () => {
            setFakeDate(secondPass, newYork);
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.toString()).toBe('2023-11-05T01:30:00-05:00[America/New_York]');
            expect(zoned.offset).toBe('-05:00');
            expect(zoned.epochMilliseconds).toBe(Date.parse(secondPass));
            expect(zoned.epochMilliseconds).toBe(Temporal.Now.instant().epochMilliseconds);
            expect(zoned.epochMilliseconds).toBe(Date.now());
        });

        it('zonedDateTimeISO() skips the hour lost to the spring-forward gap', () => {
            // 02:30 in New York does not exist on 2023-03-12
            const springForward = '2023-03-12T07:30:00.000Z';
            setFakeDate(springForward, newYork);
            const zoned = Temporal.Now.zonedDateTimeISO();

            expect(zoned.toString()).toBe('2023-03-12T03:30:00-04:00[America/New_York]');
            expect(zoned.epochMilliseconds).toBe(Date.parse(springForward));
            expect(zoned.epochMilliseconds).toBe(Temporal.Now.instant().epochMilliseconds);
        });
    });

    // a page must not be able to tell the extension is there by the error it gets back
    describe('time zone argument the original rejects', () => {
        const methods: { name: string; call: (timeZone: unknown) => unknown }[] = [
            { name: 'plainDateISO', call: (tz) => Temporal.Now.plainDateISO(tz as string) },
            { name: 'plainDateTimeISO', call: (tz) => Temporal.Now.plainDateTimeISO(tz as string) },
            { name: 'plainTimeISO', call: (tz) => Temporal.Now.plainTimeISO(tz as string) },
            { name: 'zonedDateTimeISO', call: (tz) => Temporal.Now.zonedDateTimeISO(tz as string) },
        ];

        // only a string or a ZonedDateTime is a valid time zone, anything else is a TypeError
        const zones: { name: string; zone: unknown; error: ErrorConstructor }[] = [
            { name: 'an unknown IANA id', zone: 'Not/AZone', error: RangeError },
            { name: 'a string that is not an id', zone: 'UTC+1', error: RangeError },
            { name: 'an empty string', zone: '', error: RangeError },
            { name: 'an object with an unknown timeZoneId', zone: { timeZoneId: 'Not/AZone' }, error: TypeError },
            { name: 'null', zone: null, error: TypeError },
            { name: 'a number', zone: 5, error: TypeError },
        ];

        methods.forEach(({ name, call }) => {
            zones.forEach(({ name: zoneName, zone, error }) => {
                it(`${name}() rejects ${zoneName} like the original`, () => {
                    setFakeDate(''); // off, so this is the original Temporal
                    expect(() => call(zone)).toThrow(error);

                    setFakeDate(fakeDateNy, newYork);
                    expect(() => call(zone)).toThrow(error);
                });
            });
        });
    });

    // besides an IANA name, ToTemporalTimeZoneIdentifier accepts an offset identifier and any
    // ISO 8601 / RFC 9557 string that carries a zone -- all of which we have to pass on unchanged
    describe('time zone argument the original accepts', () => {
        // `id` is the identifier the original normalizes `zone` to, `dateTime` the faked date in it
        const zones: { name: string; zone: string; id: string; dateTime: string }[] = [
            { name: 'an offset', zone: '+05:30', id: '+05:30', dateTime: '2023-01-01T08:31:02.345' },
            { name: 'an offset without minutes', zone: '-08', id: '-08:00', dateTime: '2022-12-31T19:01:02.345' },
            {
                name: 'a date-time with a time zone annotation',
                zone: '2020-06-15T00:00[Europe/Paris]',
                id: 'Europe/Paris',
                dateTime: '2023-01-01T04:01:02.345', // Paris is UTC+1 in winter
            },
            {
                name: 'a date-time with an offset',
                zone: '2020-06-15T00:00+05:30',
                id: '+05:30',
                dateTime: '2023-01-01T08:31:02.345',
            },
            {
                name: 'a date-time with a Z designator',
                zone: '2020-06-15T00:00Z',
                id: 'UTC',
                dateTime: '2023-01-01T03:01:02.345',
            },
        ];

        zones.forEach(({ name, zone, id, dateTime }) => {
            it(`accepts ${name} like the original`, () => {
                setFakeDate(''); // off, so this is the original Temporal
                expect(Temporal.Now.zonedDateTimeISO(zone).timeZoneId).toBe(id);
                expect(() => Temporal.Now.plainDateTimeISO(zone)).not.toThrow();

                setFakeDate(fakeDateNy, newYork);
                const [date, time] = dateTime.split('T');
                expect(Temporal.Now.zonedDateTimeISO(zone).timeZoneId).toBe(id);
                expect(Temporal.Now.zonedDateTimeISO(zone).toPlainDateTime().toString()).toBe(dateTime);
                expect(Temporal.Now.plainDateTimeISO(zone).toString()).toBe(dateTime);
                expect(Temporal.Now.plainDateISO(zone).toString()).toBe(date);
                expect(Temporal.Now.plainTimeISO(zone).toString()).toBe(time);
            });
        });
    });

    describe('ticking', () => {
        const sleepMs = 2; //at least 1ms
        const sleep = async () => await new Promise((res) => setTimeout(res, sleepMs));

        it('Now.instant() ticks forward without fake date', async () => {
            const first = Temporal.Now.instant().epochMilliseconds;

            await sleep();
            expect(Temporal.Now.instant().epochMilliseconds).toBeGreaterThan(first);
        });

        it('Now.instant() with fake date & tickStartTimestamp ticks forward', async () => {
            setTickStartTimestamp(new Date().valueOf().toString());
            setFakeDate(fakeDate);

            await sleep();
            const first = Temporal.Now.instant().epochMilliseconds;
            expect(first).toBeGreaterThan(fakeTimestamp);
            expect(first).toBeLessThan(fakeTimestamp + 60 * 1000); // ticking, not the real clock

            await sleep();
            expect(Temporal.Now.instant().epochMilliseconds).toBeGreaterThan(first);
        });

        it('Now.instant() with fake date & without tickStartTimestamp does not tick forward', async () => {
            setTickStartTimestamp(new Date().valueOf().toString());
            setTickStartTimestamp(''); //disable tick
            setFakeDate(fakeDate);

            await sleep();
            expect(Temporal.Now.instant().epochMilliseconds).toBe(fakeTimestamp);
        });

        it('all Now members see the same ticked time', async () => {
            setTickStartTimestamp(new Date().valueOf().toString());
            setFakeDate(fakeDate, 'UTC');

            await sleep();
            const instant = Temporal.Now.instant();
            const zoned = Temporal.Now.zonedDateTimeISO();

            //the clock may have moved on by a few ms between the two calls
            expect(zoned.epochMilliseconds - instant.epochMilliseconds).toBeLessThan(100);
            expect(zoned.epochMilliseconds).toBeGreaterThanOrEqual(instant.epochMilliseconds);
            expect(instant.epochMilliseconds).toBeGreaterThan(fakeTimestamp);
            expect(instant.epochMilliseconds).toBeLessThan(fakeTimestamp + 60 * 1000);
        });
    });

    describe('Date <-> Temporal conversion', () => {
        it('new Date().toTemporalInstant() returns the actual time', () => {
            const instant = new Date().toTemporalInstant();

            expect(instant.epochMilliseconds).toBeGreaterThanOrEqual(testStartDate.valueOf());
            expect(instant.epochMilliseconds).toBeLessThanOrEqual(Date.now());
        });

        it('new Date().toTemporalInstant() returns the fake date', () => {
            setFakeDate(fakeDate);

            expect(new Date().toTemporalInstant().epochMilliseconds).toBe(fakeTimestamp);
            expect(new Date().toTemporalInstant().toString()).toBe('2010-01-01T00:00:00Z');
        });

        it('toTemporalInstant() on a date with arguments is unaffected by the fake date', () => {
            const check = () => {
                const instant = new Date('2021-09-15T12:34:56.789Z').toTemporalInstant();
                expect(instant.epochMilliseconds).toBe(1631709296789);
                expect(instant.toString()).toBe('2021-09-15T12:34:56.789Z');
            };

            check();

            setFakeDate(fakeDate, newYork);
            check();
        });

        it('an instant can be converted back into a Date', () => {
            setFakeDate(fakeDate);

            const date = new Date(Temporal.Now.instant().epochMilliseconds);

            expect(date.toISOString()).toBe(fakeDate);
        });
    });

    describe('formatting in the faked time zone', () => {
        it('Instant.toLocaleString() uses the selected time zone', () => {
            setFakeDate(fakeDateNy, newYork);

            const instant = Temporal.Instant.from(fakeDateNy);

            expect(instant.toLocaleString('en-US')).toMatch(/12\/31\/2022, 10:01:02\WPM/);
        });

        it('Instant.toLocaleString() with an explicit time zone is unaffected', () => {
            const check = () =>
                expect(Temporal.Instant.from(fakeDateNy).toLocaleString('en-US', { timeZone: 'UTC' })).toMatch(
                    /1\/1\/2023, 3:01:02\WAM/
                );

            check();

            setFakeDate(fakeDateNy, newYork);
            check();
        });

        // the original reads every option with a plain Get(), which walks the prototype chain
        it('Instant.toLocaleString() honours a timeZone inherited from the options prototype', () => {
            const check = () => {
                const options = Object.create({ timeZone: 'UTC' }) as Intl.DateTimeFormatOptions;
                expect(Temporal.Instant.from(fakeDateNy).toLocaleString('en-US', options)).toMatch(
                    /1\/1\/2023, 3:01:02\WAM/
                );
            };

            check();

            setFakeDate(fakeDateNy, newYork);
            check();
        });

        // injecting the selected time zone must not drop the options we inherit rather than own
        it('Instant.toLocaleString() keeps inherited options when the time zone is injected', () => {
            setFakeDate(fakeDateNy, newYork);

            const timeParts = { hour: 'numeric', minute: 'numeric', hour12: false } as const;
            const inherited = Object.create(timeParts) as Intl.DateTimeFormatOptions;
            const instant = Temporal.Instant.from(fakeDateNy);

            // same as with the options as own properties: 03:01 UTC is 22:01 the day before in NY
            expect(instant.toLocaleString('en-US', { ...timeParts })).toBe('22:01');
            expect(instant.toLocaleString('en-US', inherited)).toBe('22:01');
        });

        // patching a prototype changes what every page sees, so it only happens while faking
        it('Instant.prototype.toLocaleString is only replaced while the fake date is on', () => {
            const original = Temporal.Instant.prototype.toLocaleString;
            expect(original.toString()).toContain('[native code]');

            setFakeDate(fakeDateNy, newYork);
            expect(Temporal.Instant.prototype.toLocaleString).not.toBe(original);

            setFakeDate('');
            expect(Temporal.Instant.prototype.toLocaleString).toBe(original);
            // a page can tell a JS function from a built-in by its source
            expect(Temporal.Instant.prototype.toLocaleString.toString()).toContain('[native code]');
        });

        // every state update re-runs the replacement, so the patch must not stack wrappers --
        // restoring would then only peel off the outermost one
        it('Instant.prototype.toLocaleString is restored after repeated state updates', () => {
            const original = Temporal.Instant.prototype.toLocaleString;

            setFakeDate(fakeDateNy, newYork);
            setFakeDate(fakeDate);
            setFakeDate('');
            setFakeDate('');

            expect(Temporal.Instant.prototype.toLocaleString).toBe(original);
        });

        it('Instant.toLocaleString() ignores the previous time zone after turning the fake date off', () => {
            setFakeDate(fakeDateNy, newYork);
            expect(Temporal.Instant.from(fakeDateNy).toLocaleString('en-US')).toMatch(/12\/31\/2022, 10:01:02\WPM/);

            setFakeDate('');
            const instant = Temporal.Instant.from(fakeDateNy);

            // the browser default again, i.e. the same as passing it explicitly
            // (the tests run in every time zone, so the New York rendering isn't a stable counter-example)
            expect(instant.toLocaleString('en-US')).toBe(instant.toLocaleString('en-US', { timeZone: pageTimeZone() }));
        });

        it('ZonedDateTime.toLocaleString() is unaffected (it carries its own time zone)', () => {
            const check = () => {
                const zoned = Temporal.ZonedDateTime.from('2021-09-15T12:34:56.789-04:00[America/New_York]');
                expect(zoned.toLocaleString('en-US')).toMatch(/9\/15\/2021, 12:34:56\WPM/);
            };

            check();

            setFakeDate(fakeDate, 'UTC');
            check();
        });
    });

    // Temporal values passed to the (replaced) Intl.DateTimeFormat
    describe('Intl.DateTimeFormat with Temporal values', () => {
        const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' };

        /** Intl.DateTimeFormat accepts Temporal values, but the TypeScript lib types only allow Date/number */
        const format = (formatter: Intl.DateTimeFormat, value: Temporal.Instant | Temporal.PlainDate) =>
            formatter.format(value as unknown as Date);

        it('formats a Temporal.Instant', () => {
            const check = () => {
                const instant = Temporal.Instant.from('2021-09-15T12:34:56.789Z');
                expect(format(new Intl.DateTimeFormat('en-US', options), instant)).toMatch(
                    /Sep 15, 2021, 12:34:56\WPM/
                );
            };

            check();

            setFakeDate(fakeDate, newYork);
            check();
        });

        it('formats a Temporal.PlainDate', () => {
            const check = () => {
                const plainDate = Temporal.PlainDate.from('2021-09-15');
                expect(format(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }), plainDate)).toBe(
                    'Sep 15, 2021'
                );
            };

            check();

            setFakeDate(fakeDate, newYork);
            check();
        });
    });

    // everything that does not depend on the current time must behave identically with the
    // extension on and off
    const states: { name: string; enable: () => void }[] = [
        { name: 'OFF', enable: () => {} },
        { name: 'ON', enable: () => setFakeDate(fakeDate) },
        { name: `ON with time zone`, enable: () => setFakeDate(fakeDate, newYork) },
    ];
    states.forEach(({ name, enable }) => {
        describe(`time independent APIs, fake date ${name}`, () => {
            beforeEach(() => {
                enable();
            });

            it('Instant.from()', () => {
                const instant = Temporal.Instant.from('2021-09-15T12:34:56.789Z');

                expect(instant.epochMilliseconds).toBe(1631709296789);
                expect(instant.epochNanoseconds).toBe(1631709296789000000n);
                expect(instant.toString()).toBe('2021-09-15T12:34:56.789Z');
                expect(instant.toJSON()).toBe('2021-09-15T12:34:56.789Z');
            });

            it('Instant.fromEpochMilliseconds()', () => {
                expect(Temporal.Instant.fromEpochMilliseconds(123).toString()).toBe('1970-01-01T00:00:00.123Z');
            });

            it('Instant.fromEpochNanoseconds()', () => {
                expect(Temporal.Instant.fromEpochNanoseconds(123456789n).toString()).toBe(
                    '1970-01-01T00:00:00.123456789Z'
                );
            });

            it('Instant.compare()', () => {
                const earlier = Temporal.Instant.fromEpochMilliseconds(1);
                const later = Temporal.Instant.fromEpochMilliseconds(2);

                expect(Temporal.Instant.compare(earlier, later)).toBe(-1);
                expect(Temporal.Instant.compare(later, earlier)).toBe(1);
                expect(Temporal.Instant.compare(earlier, earlier)).toBe(0);
                expect(earlier.equals(earlier)).toBe(true);
                expect(earlier.equals(later)).toBe(false);
            });

            it('Instant arithmetic', () => {
                const instant = Temporal.Instant.from('2021-09-15T12:34:56.789Z');

                expect(instant.add({ hours: 1 }).toString()).toBe('2021-09-15T13:34:56.789Z');
                expect(instant.subtract({ minutes: 34 }).toString()).toBe('2021-09-15T12:00:56.789Z');
                expect(instant.until(instant.add({ hours: 2 })).seconds).toBe(2 * 60 * 60); // seconds by default
                expect(instant.until(instant.add({ hours: 2 }), { largestUnit: 'hour' }).hours).toBe(2);
                expect(instant.since(instant.subtract({ hours: 2 }), { largestUnit: 'hour' }).hours).toBe(2);
                expect(instant.round({ smallestUnit: 'second' }).toString()).toBe('2021-09-15T12:34:57Z');
            });

            it('Instant.toZonedDateTimeISO()', () => {
                const instant = Temporal.Instant.from('2021-09-15T12:34:56.789Z');

                expect(instant.toZonedDateTimeISO(newYork).toString()).toBe(
                    '2021-09-15T08:34:56.789-04:00[America/New_York]'
                );
                expect(instant.toZonedDateTimeISO('UTC').toString()).toBe('2021-09-15T12:34:56.789+00:00[UTC]');
            });

            it('ZonedDateTime.from()', () => {
                const zoned = Temporal.ZonedDateTime.from('2021-09-15T12:34:56.789-04:00[America/New_York]');

                expect(zoned.epochMilliseconds).toBe(1631723696789);
                expect(zoned.timeZoneId).toBe(newYork);
                expect(zoned.offset).toBe('-04:00'); // EDT
                expect(zoned.hour).toBe(12);
                expect(zoned.toInstant().toString()).toBe('2021-09-15T16:34:56.789Z');
                expect(zoned.toPlainDate().toString()).toBe('2021-09-15');
                expect(zoned.toPlainTime().toString()).toBe('12:34:56.789');
                expect(zoned.toPlainDateTime().toString()).toBe('2021-09-15T12:34:56.789');
            });

            it('ZonedDateTime respects DST', () => {
                const beforeDst = Temporal.ZonedDateTime.from('2025-03-09T01:59:00-05:00[America/New_York]');
                const afterDst = beforeDst.add({ minutes: 1 });

                expect(afterDst.toString()).toBe('2025-03-09T03:00:00-04:00[America/New_York]');
                expect(afterDst.epochMilliseconds - beforeDst.epochMilliseconds).toBe(60 * 1000);
                expect(beforeDst.startOfDay().toString()).toBe('2025-03-09T00:00:00-05:00[America/New_York]');
                expect(beforeDst.hoursInDay).toBe(23);
            });

            it('PlainDate.from()', () => {
                const plainDate = Temporal.PlainDate.from('2021-09-15');

                expect(plainDate.year).toBe(2021);
                expect(plainDate.month).toBe(9);
                expect(plainDate.day).toBe(15);
                expect(plainDate.dayOfWeek).toBe(3); // Wednesday
                expect(plainDate.daysInMonth).toBe(30);
                expect(plainDate.inLeapYear).toBe(false);
                expect(plainDate.calendarId).toBe('iso8601');
                expect(plainDate.add({ days: 1 }).toString()).toBe('2021-09-16');
                expect(plainDate.subtract({ months: 1 }).toString()).toBe('2021-08-15');
                expect(plainDate.with({ day: 1 }).toString()).toBe('2021-09-01');
                expect(Temporal.PlainDate.compare(plainDate, plainDate.add({ days: 1 }))).toBe(-1);
            });

            it('PlainTime.from()', () => {
                const plainTime = Temporal.PlainTime.from('12:34:56.789');

                expect(plainTime.hour).toBe(12);
                expect(plainTime.minute).toBe(34);
                expect(plainTime.second).toBe(56);
                expect(plainTime.millisecond).toBe(789);
                expect(plainTime.add({ hours: 1 }).toString()).toBe('13:34:56.789');
            });

            it('PlainDateTime.from()', () => {
                const plainDateTime = Temporal.PlainDateTime.from('2021-09-15T12:34:56.789');

                expect(plainDateTime.toString()).toBe('2021-09-15T12:34:56.789');
                expect(plainDateTime.toPlainDate().toString()).toBe('2021-09-15');
                expect(plainDateTime.toPlainTime().toString()).toBe('12:34:56.789');
                expect(plainDateTime.toZonedDateTime('UTC').toString()).toBe('2021-09-15T12:34:56.789+00:00[UTC]');
            });

            it('PlainYearMonth.from()', () => {
                const yearMonth = Temporal.PlainYearMonth.from('2021-09');

                expect(yearMonth.toString()).toBe('2021-09');
                expect(yearMonth.daysInMonth).toBe(30);
                expect(yearMonth.toPlainDate({ day: 15 }).toString()).toBe('2021-09-15');
            });

            it('PlainMonthDay.from()', () => {
                const monthDay = Temporal.PlainMonthDay.from('09-15');

                expect(monthDay.toString()).toBe('09-15');
                expect(monthDay.toPlainDate({ year: 2021 }).toString()).toBe('2021-09-15');
            });

            it('Duration.from()', () => {
                const duration = Temporal.Duration.from('PT1H30M');

                expect(duration.hours).toBe(1);
                expect(duration.minutes).toBe(30);
                expect(duration.total('minutes')).toBe(90);
                expect(duration.toString()).toBe('PT1H30M');
                expect(duration.negated().toString()).toBe('-PT1H30M');
            });

            it('constructors and prototypes are unchanged', () => {
                expect(Temporal.Instant.from('2021-09-15T12:34:56.789Z')).toBeInstanceOf(Temporal.Instant);
                expect(Temporal.PlainDate.from('2021-09-15')).toBeInstanceOf(Temporal.PlainDate);
                expect(Temporal.Instant.prototype[Symbol.toStringTag]).toBe('Temporal.Instant');
                expect(Temporal.ZonedDateTime.prototype[Symbol.toStringTag]).toBe('Temporal.ZonedDateTime');
            });

            it('valueOf() still throws', () => {
                // Temporal objects refuse implicit conversion to a primitive
                expect(() => Temporal.Instant.from('2021-09-15T12:34:56.789Z').valueOf()).toThrow();
            });
        });
    });

    /** analogous to the Date.prototype checks in replace-date.test.ts, see issue #41 */
    it('Temporal.Now should have the same ownProperties available when time travel is enabled', () => {
        setFakeDate('');
        const origProperties = Object.getOwnPropertyNames(Temporal.Now);

        setFakeDate(fakeDate);
        expect(Object.getOwnPropertyNames(Temporal.Now)).toEqual(expect.arrayContaining(origProperties));
        expect(Object.getOwnPropertyNames(Temporal.Now)).toHaveLength(origProperties.length);
    });

    /** the attributes of every own property, which `getOwnPropertyNames` above does not see */
    const propertyFlags = (namespace: object) =>
        Object.fromEntries(
            Object.getOwnPropertyNames(namespace).map((name) => {
                const { writable, enumerable, configurable } = Object.getOwnPropertyDescriptor(namespace, name) ?? {};
                return [name, { writable, enumerable, configurable }];
            })
        );

    // natively the namespaces expose non-enumerable properties and a toStringTag, so a page that
    // iterates or tag-sniffs them must not see anything different, see issue #41
    it.each([
        { name: 'Temporal', get: () => Temporal },
        { name: 'Temporal.Now', get: () => Temporal.Now },
    ])('$name keeps its shape when time travel is enabled', ({ get }) => {
        setFakeDate('');
        const origKeys = Object.keys(get());
        const origFlags = propertyFlags(get());
        const origTag = Object.prototype.toString.call(get());

        setFakeDate(fakeDate);

        expect(Object.keys(get())).toEqual(origKeys); // natively [], the properties are non-enumerable
        expect({ ...get() }).toEqual({});
        expect(propertyFlags(get())).toEqual(origFlags);
        expect(Object.prototype.toString.call(get())).toBe(origTag);
    });

    it('Temporal classes are not replaced when time travel is enabled', () => {
        setFakeDate('');
        const { Instant, ZonedDateTime, PlainDate, PlainDateTime, PlainTime } = Temporal;

        setFakeDate(fakeDate);

        expect(Temporal.Instant).toBe(Instant);
        expect(Temporal.ZonedDateTime).toBe(ZonedDateTime);
        expect(Temporal.PlainDate).toBe(PlainDate);
        expect(Temporal.PlainDateTime).toBe(PlainDateTime);
        expect(Temporal.PlainTime).toBe(PlainTime);

        // values created while faking are instances of the original classes
        expect(Temporal.Now.instant()).toBeInstanceOf(Instant);
        expect(Temporal.Now.zonedDateTimeISO()).toBeInstanceOf(ZonedDateTime);
        expect(Temporal.Now.plainDateISO()).toBeInstanceOf(PlainDate);
        expect(Temporal.Now.plainDateTimeISO()).toBeInstanceOf(PlainDateTime);
        expect(Temporal.Now.plainTimeISO()).toBeInstanceOf(PlainTime);
    });
});
