# ![](/images/icon-32.png) Time Travel

[![Latest tag](https://flat.badgen.net/github/tag/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/tags)
[![Chrome Web Store](https://flat.badgen.net/chrome-web-store/v/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Status](https://flat.badgen.net/github/checks/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/actions/workflows/node.js.yml)
[![License](https://flat.badgen.net/github/license/cpulvermacher/time-travel)](./LICENSE)

A Chrome extension to change the current date and time seen by websites. The
result is similar to changing the system time, and can be used to debug
frontend JavaScript applications.

## Usage
- Click the extension icon in the toolbar.
- Enter the date and time you want to set and confirm, e.g.:
  - "2023-04-27 12:40" (local time)
  - "2023-04-27" (midnight local time)
  - "2023-04-27T12:40Z" (UTC)
- When first activating the extension on a tab, click Reload when prompted.
- 🎉 Any JavaScript `Date` object will now return the fake date/time you set!

To restore the system time, click the extension icon and press Reset.

By default, the clock will be paused when the fake time is turned on.
You can press the play (▶) button to make the fake clock tick forward at a normal rate.
Press stop (⏹) to pause the clock .

## Limitations
- Only Chrome / Chromium support (for now)
- Only JavaScript is affected by the extension.
- The extension does not work in iframes with the `sandbox` attribute

## Installation
Get it from the Chrome Web Store: https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg

## Build
To build and use a local version:
- Download this repository
- Run `npm run dev` (or `npm run build` for a production version)
- Open chrome://extensions
- Enable 'Developer Mode'
- Click 'Load unpacked' and select the `dist/` directory
