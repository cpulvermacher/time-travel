# Time Zone Support

## Overview

The `Change time zone` toggle in the UI is off by default, so the browser's time zone is used. With this setting, no time-zone-related behaviour of Date should be changed when enabling the extension. Turning the toggle on reveals the time zone selector.

If the time zone option is changed, the `Set date and time` value is shown and entered as local time in the configured time zone, using the same parsing rules as the page (see below). The input label names the configured zone, e.g. `Set date and time (London)`.
Inside the page's JavaScript environment, all `Date` and `Intl.DateTimeFormat` objects will behave as if they were run in the configured time zone.

This means that if you configure a fake date of `2025-02-05 17:32`, the page will see a local time of Feb 5 17:32 in whichever time zone is configured, and the UTC instant differs accordingly:

- London (in February: GMT) shows 17:32 (17:32 UTC),
- Tokyo (constant UTC+09:00) shows 17:32 (08:32 UTC),
- Pacific/Chatham (in February: UTC+13:45 with DST) shows 17:32 (03:47 UTC).

Changing the time zone therefore keeps the entered local time and moves the instant it denotes. A changed zone is
not applied immediately, but together with the date when pressing the apply button, which names both, e.g.
`Change to Feb 5, 2025 5:32 PM (London)`. The browser's own time zone plays no role.

## Modified Date Behaviour

If a time zone is set, `Date` or `Intl.DateTimeFormat` should behave as if the user's browser was using this time zone:

- Getting the current date returns the fake date in the configured time zone.
- When passing a datetime string without offset information to Date.parse() or the Date constructor, the date is parsed in the configured time zone. If the string includes Z or an offset, the offset is used instead. If the string does not include a time (e.g. "2025-08-01"), the time will be set to midnight UTC (!) to match the spec.
- The Date(year, month, day, hour, ...) constructor and set...() methods will use the configured time zone.
- All string getters (except toISOString()) will use the configured time zone. E.g. `new Date('2025-08-04T12:00:00Z').toString()` might return "Mon Aug 04 2025 14:00:00 GMT+0200 (Central European Summer Time)"
- getTimezoneOffset() returns the offset for the configured time zone (at the given date value).
- Intl.DateTimeFormat uses the configured time zone if the time zone parameter is not explicitly set.

The following do not change:

- getTime()/setTime()
- getUTC...()/setUTC...() methods
- The Date(epoch) constructor and setUTC...() methods

### Offset Changes / Daylight Saving Time

Daylight saving time (DST) and other changes in the time zone offset are reflected as well, both for the configured fake date and any other Date objects created at runtime.

The time zone selector shows the offset each zone has at the currently entered date, and the date the page sees plus its concrete offset is shown above the fake date input.

A DST offset of the effective page date is shown in a different colour. In case time zone offsets change for other reasons, this might be falsely shown as DST. Hovering the offset gives the zone name and states whether DST is in effect for that date, or is observed at other times of the year. The extension icon's tooltip shows the same information for the date the page currently sees.

Changing offsets can make some times ambiguous. For example, there might be two 2:00 a.m. values during a transition from DST to non-DST. To match browser implementations and the spec, any ambiguity is resolved by using the time zone offset before the transition. This affects the behaviour of local dates passed to Date.parse(), non-UTC setters, and the constructor, as well as the date entered in the UI (which uses the same parser).

The second of the two values can therefore only be expressed with an explicit offset, e.g. `2025-10-26 02:30+01:00`. When stepping through such an hour with the arrow keys, the UI adds that offset automatically.

## Technical Details

We use the UTC value of the Date object as the source of truth. When the configured time zone is changed, all methods relating to local time are overridden to use the configured time zone. Changing the time zone at runtime is supported.

Compared to setting a fake current date, changing the time zone affects all Date objects, not only the creation of new Dates. To reduce the impact of implementation bugs, the original Date methods are used unless the time zone is changed.

### Ambiguous or Skipped Times

How do we resolve local times plus a time zone name into a UTC timestamp and an offset? How do we handle DST transitions?

Follow the following steps for `new Date(year, month, ...)`, `new Date(local date string)`, `Date.parse(local date string)`, and `Date.set...()`:

- Normalize the input by handling it as UTC, either
    - a) String parsing: parse as UTC
    - b) Setters: Call Date.UTC() with arguments, replacing any non-provided values with the current values. This handles underflows/overflows as well.
- Get a first approximation of the date: use the UTC date (within 24h of the real date) to determine an offset, and create a new date based on the input and the obtained offset.
- Find all valid offsets: Find offsets before and after the approximate date. Check if the date is valid if we use these offsets.
    - Add offset to local timestamp to create UTC timestamp, format this instant in the configured time zone.
    - Check if the output matches the desired local date.
- Take the earliest timestamp that produces the desired local date.
- If no match is found (date was skipped in local time), use the offset before the current transition. This results in a timestamp _after_ the transition.

For parse() or Date(string), we forward the arguments to the original implementation if the string argument contains a time zone offset or "Z", or if a date-only format interpreted in UTC ("2025-08-01") is used.
