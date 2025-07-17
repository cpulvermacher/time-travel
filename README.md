# ![](/images/icon-32.png) Time Travel

[![Latest Release](https://flat.badgen.net/github/release/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/releases)
[![Chrome Web Store](https://flat.badgen.net/chrome-web-store/v/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/timetravel?style=flat-square)](https://addons.mozilla.org/en-US/firefox/addon/timetravel/)
[![Installs](https://flat.badgen.net/chrome-web-store/users/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Status](https://flat.badgen.net/github/checks/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/actions/workflows/node.js.yml)
[![License](https://flat.badgen.net/github/license/cpulvermacher/time-travel)](./LICENSE)

A browser extension to fake the current date and time in JavaScript `Date` or `Intl.DateTimeFormat` objects, to help you debug time-dependent frontend applications without having to change the system time.

https://github.com/user-attachments/assets/74f0ee57-f941-4b94-9176-5445d58fd8a1

## Usage
- Open the tab you want to change the time in.
- Click the Extensions icon in the toolbar, then click Time Travel.
- Choose a date from the calendar and edit the time if necessary, or enter a date and time directly (see examples below).
- Confirm with `Enter` or by clicking the "Change Date" button. In Chrome, when first activating the extension on a tab, the page needs to be reloaded once to apply the changes.
- Any JavaScript `Date` or `Intl.DateTimeFormat` in the current tab now returns the fake date/time you set. Other tabs and origins are not affected.

To restore the system time, click the extension icon and switch off the "Enable Fake Date" toggle.

When the fake date is enabled, the clock runs forward from the configured time.
You can stop the clock by switching on the "Stop Clock" toggle. The fake date will be reset to the last value you set.

### Example Dates and Formats
- `2025-04-27 12:40` - Local time
- `2025-03-30 00:59:55` - Assuming your system timezone is Europe/London (GMT), 5 seconds before a one-hour jump to 2 a.m. (summer time)
- `2025-04-27T12:40Z` - Set local equivalent for given UTC time
- `2025-04-27T12:40+1130` - Set local equivalent for time with +11:30 timezone offset. Note that actual time zone is not changed
- `2025-03-25T12:40:00.120` - Local time with milliseconds
- `1731493140025` - UNIX timestamp

## Features
- Fakes date and time for all methods of `Date` and `Intl.DateTimeFormat` objects.
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

For Chrome, Opera, Edge, and other Chromium-based browsers, install the extension from the Chrome Web Store: https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg
For Firefox (Desktop or Android), install it from: https://addons.mozilla.org/en-US/firefox/addon/timetravel/

## Development
To build and use a local version:
- Clone this repository and run `pnpm install`.
- Run `pnpm dev` (or `pnpm build` for a production version).

### Chrome
- Open chrome://extensions and enable 'Developer Mode'.
- Click 'Load unpacked' and select the `dist/chrome` directory

### Firefox
Start a new Firefox instance with the extension loaded using `(cd dist/firefox; npx web-ext run)`, or install manually via:
- Open about:debugging
- Navigate to 'This Firefox'
- Click 'Temporary Extensions' > 'Load Temporary Add-on...' and select `dist/firefox/manifest.json`.

## Contributing

Contributions are welcome! If you have ideas, bug reports, or want to help improve Time Travel, please open an issue or submit a pull request on [GitHub](https://github.com/cpulvermacher/time-travel).
