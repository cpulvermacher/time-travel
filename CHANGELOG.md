# Change Log

## [3.0.0]
- Improve extension popup UI:
    - Show ON/OFF state and used date/time for the current tab on top.
    - (breaking change) If `Change time zone` is active, interpret date and time input in the given time zone unless a specific offset is entered. (previously: browser timezone)
    - (breaking change) Timezone is only changed when confirming the new value. (previously: applied immediately)
    - In time zone list, show UTC offset for current draft date.
    - Show date and/or timezone change to apply in main button, or "No Changes" if unchanged.
    - Improve calendar style consistency.
    - Replace the `(?)` on the date input with a `Keys & formats` link, also explain keyboard shortcuts in the popup.
    - Use checkboxes for `Change time zone` and `Auto reload`, since they take effect only on apply.
    - Faster animations, no more animations triggered by keyboard focus.
- Allow disabling fake date by emptying input and pressing Enter.
- Add Page Up / Page Down shortcuts for adjusting current input by 1 day.
- Fix: Pressing Arrow Up / Down keys (+Shift/Ctrl/Cmd/Alt modifiers) in the date input now modifies the _instant_, so DST transitions can now be stepped through as expected.
- Fix: wrong sign for negative sub-hour UTC offsets (e.g. Africa/Monrovia before 1972).
- Improve contrast for extension icon.
- Drop comments from distributed files (25% size reduction, but intentionally not minified).

## [2.5.1]

- Fix: restore background color change when changing the date.

## [2.5.0]

- Improved support for frames, now changes are immediately reflected in all frames of the current tab.
- Keep working on pages that block `sessionStorage` access or call `sessionStorage.clear()` (fixes #54 or #45).

## [2.4.7]

- Dependency updates and internal improvements.

## [2.4.6]

- Update dependencies.

## [2.4.5]

- Remove "experimental" label from time zone support.
- Remove all debug logging from production build.

## [2.4.4]

- Handle months with six weeks without layout shift.

## [2.4.3]

- Add French translation (closes #52). Many thanks to @Pallandos.
- Fix: If seconds/milliseconds were set in date, show them when opening popup again (with extension enabled + clock stopped).
- Remove underscores from time zone labels.

## [2.4.2]

- Add a "Change Time Zone" toggle instead of requiring selecting the "Default" time zone to turn the feature off.
- Firefox: Fix "Missing host permissions on tab" error when changing settings quickly.
- Firefox: Always disable extension on `about:` URLs.
- Android: Show time picker automatically after choosing a date in the calendar.
- Fix Date parsing if local time zone includes seconds in offset. (only with time zone feature enabled)
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
