Fake the current date, time and time zone in JavaScript Date, Intl.DateTimeFormat or Temporal objects.
Time Travel helps you debug time-dependent frontend applications without having to change the system time.

Features:
- Fakes date and time for all methods of `Date` and `Intl.DateTimeFormat` objects, and for `Temporal.Now` where the browser supports it.
- Time zone can be changed, with full support for DST transitions.
- Time can be stopped and resumed.
- Option to automatically reload page after changing date.
- Only affects current tab after clicking the extension icon.

Limitations:
- Only JavaScript is affected by the extension.
- Some functionality or animations may behave strangely if the clock is stopped.
- The extension does not work in iframes with the `sandbox` attribute.

Usage:
- Open the tab you want to change the time in.
- Click the Extensions icon in the toolbar, then click Time Travel.
- Choose a date from the calendar and edit the time if necessary, or enter a date and time directly (see examples below).
- Confirm with `Enter` or by clicking the apply button, which shows a preview of the change to apply (e.g. "Change date to Apr 27, 2025 12:40").
- Any JavaScript `Date`, `Intl.DateTimeFormat` or `Temporal.Now` in the current tab now returns the fake date/time you set. Other tabs and origins are not affected.

To restore the system time, click the extension icon and switch off the "Fake JavaScript date" toggle, or clear the input field and press `Enter`.

When the fake date is enabled, the clock runs forward from the configured time. The current page time is shown under "Page sees:", which also displays the real time while the extension is off.
You can stop the clock by switching on the "Stop clock" toggle. The fake date will be reset to the last value you set.

To change the time zone, enable "Change time zone" and select a time zone from the dropdown.
When enabled, `Date` objects, `Intl.DateTimeFormat` and `Temporal.Now` will use this time zone instead of the system time zone.
Date and time input is then interpreted as local time in the selected time zone as well (input label shows e.g. "Set date and time (London)").
Switching to a different time zone keeps the entered *local* date and time, which may change the instant (unless the input field contains a UTC instant).

A badge next to the effective page time shows the UTC offset in use, with an icon marking whether the date falls into daylight saving time or standard time.
Hovering over the badge will show further details.

Example Dates and Formats:
- `2025-04-27 12:40` - Local time
- `2025-03-30 00:59:55` - Assuming your system time zone is Europe/London (GMT), 5 seconds before a one-hour jump to 2 a.m. (summer time)
- `2025-04-27T12:40Z` - Set local equivalent for given UTC time
- `2025-04-27T12:40+1130` - Set local equivalent for time with +11:30 time zone offset. Note that actual time zone is not changed
- `2025-03-25T12:40:00.120` - Local time with milliseconds
- `1731493140025` - UNIX timestamp

This extension is open source software licensed under the MIT license.

If you have ideas, bug reports, or want to help improve Time Travel, please open an issue on [GitHub](https://github.com/cpulvermacher/time-travel).
