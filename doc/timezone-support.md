# Timezone Support

## Overview

The Timezone option in the UI defaults to the browser's timezone. With this setting, no timezone-related behaviour of Date should be changed when enabling the extension.

If the Timezone option is changed, the instant defined by the `Date and time to set` value will be converted into the given timezone. By default, date/time is shown and entered in the browser's timezone, and the equivalent date/time in the target timezone will be shown in the UI.
Inside the page's JavaScript environment, all `Date` and `Intl.DateTimeFormat` objects will behave as if they were run in the configured timezone.

This means that if your system timezone is New York (UTC-05:00), and you configure a fake date of `2025-02-05 17:32`, setting the timezone to:

- London (in February: GMT) will produce a local time of 22:32 on Feb 5,
- Tokyo (constant UTC+06:00) will produce 07:32 on Feb 6,
- and Pacific/Chatham (in February: UTC+13:45 with DST) will produce 12:17 on Feb 6.

In all cases, the UTC time is unchanged, and only the local time value will change.

## Modified Date Behaviour

If a timezone is set, `Date` or `Intl.DateTimeFormat` should behave as if the user's browser was using this timezone:

- Getting the current date returns the fake date in the configured timezone.
- When passing a datetime string without offset information to Date.parse() or the Date constructor, the date is parsed in the configured timezone. If the string includes Z or an offset, the offset is used instead. If the string does not include a time (e.g. "2025-08-01"), the time will be set to midnight UTC (!) to match the spec.
- The Date(year, month, day, hour, ...) constructor and set...() methods will use the configured timezone.
- All string getters (except toISOString()) will use the configured timezone. E.g. `new Date('2025-08-04T12:00:00Z').toString()` might return "Mon Aug 04 2025 14:00:00 GMT+0200 (Central European Summer Time)"
- getTimezoneOffset() returns the offset for the configured timezone (at the given date value).
- Intl.DateTimeFormat uses the configured timezone if the timezone parameter is not explicitly set.

The following do not change:

- getTime()/setTime()
- getUTC...()/setUTC...() methods
- The Date(epoch) constructor and setUTC...() methods

### Offset Changes / Daylight Saving Time

Daylight saving time (DST) and other changes in the timezone offset are reflected as well, both for the configured fake date and any other Date objects created at runtime.

While the timezone selector in the UI only shows one offset (for the current real date), the resulting local date and concrete offset is shown below the fake date input. DST offsets are shown in a different colour. In case timezone offsets change for other reasons, this might be falsely shown as DST.

Changing offsets can make some times ambiguous. For example, there might be two 2:00 a.m. values during a transition from DST to non-DST. To match browser implementations and the spec, any ambiguity is resolved by using the timezone offset before the transition. This affects the behaviour of local dates passed to Date.parse(), non-UTC setters, and the constructor.

## Technical Details

We use the UTC value of the Date object as the source of truth. When the configured timezone is changed, all methods relating to local time are overridden to use the configured timezone. Changing the timezone at runtime is supported.

Compared to setting a fake current date, changing the timezone affects all Date objects, not only the creation of new Dates. To reduce the impact of implementation bugs, the original Date methods are used unless the timezone is changed.

### Ambiguous or Skipped Times

How do we resolve local times plus a timezone name into a UTC timestamp and an offset? How do we handle DST transitions?

Follow the following steps for `new Date(year, month, ...)`, `new Date(local date string)`, `Date.parse(local date string)`, and `Date.set...()`:

- Normalize the input by handling it as UTC, either
    - a) String parsing: parse as UTC
    - b) Setters: Call Date.UTC() with arguments, replacing any non-provided values with the current values. This handles underflows/overflows as well.
- Get a first approximation of the date: use the UTC date (within 24h of the real date) to determine an offset, and create a new date based on the input and the obtained offset.
- Find all valid offsets: Find offsets before and after the approximate date. Check if the date is valid if we use these offsets.
    - Add offset to local timestamp to create UTC timestamp, format this instant in the configured timezone.
    - Check if the output matches the desired local date.
- Take the earliest timestamp that produces the desired local date.
- If no match is found (date was skipped in local time), use the offset before the current transition. This results in a timestamp _after_ the transition.

For parse() or Date(string), we forward the arguments to the original implementation if the string argument contains a timezone offset or "Z", or if a date-only format ("2025-08-01") is used.
