# ![](/images/icon-32.png) Time Travel

[![Latest Release](https://flat.badgen.net/github/release/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/releases)
[![Chrome Web Store](https://flat.badgen.net/chrome-web-store/v/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Installs](https://flat.badgen.net/chrome-web-store/users/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Status](https://flat.badgen.net/github/checks/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/actions/workflows/node.js.yml)
[![License](https://flat.badgen.net/github/license/cpulvermacher/time-travel)](./LICENSE)

A Chrome extension to fake the current date returned by JavaScript `Date` or `Intl.DateTimeFormat` objects.
You can use it to debug time-dependent frontend applications without having to change the system time.

## Usage
- Open the tab you want to change the time in.
- Click the Extensions icon in the toolbar, then click Time Travel.
- Edit the date and time in the input field directly, or click the calendar icon to choose the date visually.
- Confirm with `Enter` or by clicking the "Change Date" button. When first activating the extension on a tab, the page needs to be reloaded once to apply the changes.
- Any JavaScript `Date` or `Intl.DateTimeFormat` in the current tab now returns the fake date/time you set.

To restore the system time, click the extension icon and press Reset.

When the fake time is turned on, the clock is paused by default.
You can press the play (▶) button to make the fake clock tick forward at a normal rate.
Press stop (⏹) to pause the clock.

### Examples
This lists some possible dates and formats supported:
- "2023-04-27 12:40" (local time)
- "2023-04-27" (midnight UTC)
- "2025-03-30 00:59:55" (assuming your system timezone is Europe/London(GMT), 5 seconds before a one-hour jump to 2a.m. to summer time)
- "2023-04-27T12:40Z" (set local equivalent for given UTC time)
- "2023-04-27T12:40+1130" (set local equivalent for time with +11:30 timezone offset. Note that actual time zone is not changed)
- "2023-03-25T12:40:00.120" (local time with milliseconds)
- "1731493140025" (UNIX timestamp)

## Features
- Fakes date and time for all methods of `Date` and `Intl.DateTimeFormat` objects.
- Time can be stopped and resumed.
- Minimal permissions, only accesses current tab after clicking the extension icon.

## Limitations
- Only JavaScript is affected by the extension.
- Some functionality or animations may behave strangely if the clock is stopped. Try resuming the clock via the ▶ button in that case.
- The extension does not work in iframes with the `sandbox` attribute.
- No support for Firefox (yet)

## Installation
For Chrome, Edge, and other Chromium-based browsers, install the extension from the Chrome Web Store: https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg

## Development
To build and use a local version:
- Clone this repository and run `npm install`.
- Run `npm run dev` (or `npm run build` for a production version).
- Open chrome://extensions and enable 'Developer Mode'.
- Click 'Load unpacked' and select the `dist/` directory
