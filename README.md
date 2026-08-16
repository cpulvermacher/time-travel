# ![](/images/icon-32.png) Time Travel

[![Latest Release](https://flat.badgen.net/github/release/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/releases)
[![Chrome Web Store](https://flat.badgen.net/chrome-web-store/v/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chromewebstore.google.com/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/timetravel?style=flat-square)](https://addons.mozilla.org/en-US/firefox/addon/timetravel/)
[![Installs](https://flat.badgen.net/chrome-web-store/users/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![License](https://flat.badgen.net/github/license/cpulvermacher/time-travel)](./LICENSE)

A browser extension to fake the current date, time and time zone in JavaScript `Date` or `Intl.DateTimeFormat` objects, to help you debug time-dependent frontend applications without having to change the system time.

https://github.com/user-attachments/assets/74f0ee57-f941-4b94-9176-5445d58fd8a1

## Usage

- Open the tab you want to change the time in.
- Click the Extensions icon in the toolbar, then click Time Travel.
- Choose a date from the calendar and edit the time if necessary, or enter a date and time directly (see examples below).
- Confirm with `Enter` or by clicking the apply button, which shows a preview of the change to apply (e.g. "Change date to Apr 27, 2025 12:40"). In Chrome, when first activating the extension on a tab, the page needs to be reloaded once to apply the changes.
- Any JavaScript `Date` or `Intl.DateTimeFormat` in the current tab now returns the fake date/time you set. Other tabs and origins are not affected.

To restore the system time, click the extension icon and switch off the "Fake JavaScript date" toggle, or clear the input field and press `Enter`.

When the fake date is enabled, the clock runs forward from the configured time. The current page time is shown under "Page sees:", which also displays the real time while the extension is off.
You can stop the clock by switching on the "Stop clock" toggle. The fake date will be reset to the last value you set.

To change the time zone, enable "Change time zone" and select a time zone from the dropdown.
When enabled, both `Date` objects and `Intl.DateTimeFormat` will use this time zone instead of the system time zone.
Date and time input is then interpreted as local time in the selected time zone as well (input label shows e.g. "Set date and time (London)").
Switching to a different time zone keeps the entered *local* date and time, which may change the instant (unless the input field contains a UTC instant).

A badge next to the effective page time shows the UTC offset in use, with an icon marking whether the date falls into daylight saving time or standard time.
Hovering over the badge will show further details.

### Example Dates and Formats

Dates without offset information are interpreted as local time in the selected time zone, or in the system time zone if "Change time zone" is off.

- `2025-02-27 12:40` - Local time
- `27 Feb 2025 12:40` - Local time with month name
- `2025-03-30 00:59:55` - Assuming the selected time zone is Europe/London (GMT), 5 seconds before a one-hour jump to 2 a.m. (summer time)
- `2025-02-25T12:40:00.120` - Local time with milliseconds
- `2025-04-27T12:40Z` - Set local equivalent for a given instant in UTC
- `1731493140025` - UNIX timestamp
- `2025-04-27T12:40+02:00` - Set local equivalent for time with +02:00 time zone offset. Note that actual time zone is not changed

## Features

- Fakes date and time for all methods of `Date` and `Intl.DateTimeFormat` objects.
- Time zone can be changed, with full support for DST transitions.
- Time can be stopped and resumed.
- Option to automatically reload page after changing date.
- Only affects current tab after clicking the extension icon.
- Minimal permissions (in Chrome)

## Limitations

- Only JavaScript is affected by the extension.
- Some functionality or animations may behave strangely if the clock is stopped.
- The extension does not work in iframes with the `sandbox` attribute.

## Installation

This extension is compatible with Chromium-based browsers (version 109+) and Firefox (version 128+).

For Chrome, Opera, Edge, and other Chromium-based browsers, install the extension from the Chrome Web Store: https://chromewebstore.google.com/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg

For Firefox (Desktop or Android), install it from: https://addons.mozilla.org/en-US/firefox/addon/timetravel/

## Development

To build and use a local version:

- Clone this repository and run `pnpm install`.
- Run `pnpm dev` (or `pnpm build` for a production version).

### Tests

- `pnpm test` runs the unit tests.
- `pnpm test:e2e` runs the Playwright end-to-end tests. They drive the popup on the Vite dev server (started automatically),
  where the extension APIs are mocked and the tab state is kept in `localStorage`. The browsers need to be installed once
  using `pnpm exec playwright install chromium firefox`. To run a single browser, use e.g. `pnpm test:e2e --project=chromium`.

### Chrome

- Open chrome://extensions and enable 'Developer Mode'.
- Click 'Load unpacked' and select the `dist/chrome` directory

### Firefox

Start a new Firefox instance with the extension loaded using `(cd dist/firefox; pnpm exec web-ext run)`, or install manually via:

- Open about:debugging
- Navigate to 'This Firefox'
- Click 'Temporary Extensions' > 'Load Temporary Add-on...' and select `dist/firefox/manifest.json`.

## Contributing

If you have ideas, bug reports, or want to help improve Time Travel, please open an issue on [GitHub](https://github.com/cpulvermacher/time-travel).
