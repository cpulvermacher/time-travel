# ![](/images/icon-32.png) Time Travel

[![Latest tag](https://flat.badgen.net/github/tag/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/tags)
[![Chrome Web Store](https://flat.badgen.net/chrome-web-store/v/jfdbpgcmmenmelcghpbbkldkcfiejcjg)](https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg)
[![Status](https://flat.badgen.net/github/checks/cpulvermacher/time-travel)](https://github.com/cpulvermacher/time-travel/actions/workflows/node.js.yml)
[![License](https://flat.badgen.net/github/license/cpulvermacher/time-travel)](./LICENSE)

A Chrome extension to change the current date and time seen by websites. The
result is similar to changing the system time, and can be used to debug
frontend JavaScript applications.

## Usage
- Click the extension icon in the toolbar
- Enter the date and time you want to set and confirm, e.g.:
  - "2023-04-27 12:40" (local time)
  - "2023-04-27T12:40Z" (UTC)
  - "2023-04-27" (midnight local time)
- When first activating the extension on a tab, click Reload when prompted
- 🎉 Any JavaScript `Date` object will now return the constant date/time you set!

To restore the system time, click the extension icon again and press Reset.

## Limitations
- Only Chrome support (for now)
- Only JavaScript is affected by the extension. 
- The extension does not work in iframes with the `sandbox` attribute
- Calling `Date()` without `new` still returns real time 
- Some apps require a ticking clock and may break when setting a static fake date

## Installation
Get it from the Chrome Web Store: https://chrome.google.com/webstore/detail/time-travel/jfdbpgcmmenmelcghpbbkldkcfiejcjg

To build and use a local version:
- Download this repository
- run `npm run build`
- Open chrome://extensions
- Enable 'Developer Mode'
- Click 'Load unpacked' and select the `dist/` directory

## Similar extensions
- Change Timezone (Time Shift)
    Allows you to change the time zone, but not the time. Can be combined with Time Travel.
    Website: https://mybrowseraddon.com/change-timezone.html