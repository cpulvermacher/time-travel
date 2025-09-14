# Change Log

## [2.4.2]

- Add a "Change Time Zone" toggle, Instead of requiring selecting the "Default" time zone to turn the feature off.
- Firefox: Fix "Missing host permissions on tab" error when changing settings quickly.
- Firefox: Always disable extension on `about:` URLs.
- Android: Show time picker automatically after choosing a date in the calendar.
- Make detection of Android platform more robust.

## [2.4.1]

- On Firefox for Android, show clock icon next to input field to open native time picker.
- Some adjustments to texts, focus/disabled styles and the time zone preview.
- Refactorings and minor performance optimizations.

## [2.4.0]

- Avoid compatibility issues with the `privacy.resistFingerprinting` option in Firefox. With this option enabled, the page would always use GMT and a fake date set in the browser time zone would be set as UTC instead.
- Add support for changing the page's time zone. This is still experimental and may break in unexpected ways. See [doc/time-zone-support.md](doc/time-zone-support.md) for details.

Will roll out to Firefox first, and very slowly for Chrome.

## [2.3.2]

- On MacOS, use `Cmd` instead of `Ctrl` for keyboard shortcuts.
- Show keybord shortcuts as tooltip on date/time input.

## [2.3.1]

- Feature: Allow using arrow up/down keys to adjust time. Up/Down adjust by 1 minute, add Shift for 10min, Ctrl for 1h, Alt for 1s steps.
- Fix: Show error messages with consistent size in Firefox.
