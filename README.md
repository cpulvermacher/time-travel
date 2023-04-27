Change the current date and time seen by websites. The result is similar to
changing the system time, and can be used to debug frontend applications.

- Spoof the current time visible to JavaScript applications
- You can set e.g. "2023-04-27 12:40", "2023-04-27T12:40Z" (UTC)
  or "2023-04-27" (midnight)

# Limitations
- Only Chrome support (for now)
- Only JavaScript is affected by the extension. 
- The extension does not work in iframes with the `sandbox` attribute
- Calling `Date()` without `new` still returns real time 
- Some apps require a ticking clock and may break when setting a static fake date

# Installation
- Download this repository
- run `npm run build`
- Open chrome://extensions
- Enable 'Developer Mode'
- Click 'Load unpacked' and select the `dist/` directory

# Similar extensions
- Change Timezone (Time Shift)
    Allows you to change the time zone, but not the time. Can be combined with Time Travel.
    Website: https://mybrowseraddon.com/change-timezone.html