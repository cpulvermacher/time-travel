<script lang="ts">
    import { DatePicker } from '@svelte-plugins/datepicker';
    import { untrack } from 'svelte';
    import { formatLocalDate } from '@/date/format';
    import { parseDate } from '@/date/parse';
    import { getFirstDayOfWeek } from '@/display/i18n';
    import { getUILanguage } from '@/web-ext/browser';
    import { m } from '../paraglide/messages';

    interface Props {
        selectedDay: string; // "YYYY-MM-DD"; anything else keeps the previously selected day
        onSelectDay: (day: string) => void; // called with the picked day as "YYYY-MM-DD"
    }
    let { selectedDay, onSelectDay }: Props = $props();

    // DatePicker uses 0 (Sunday) .. 6 (Saturday), but getFirstDayOfWeek uses 1 (Monday) .. 7 (Sunday)
    const startOfWeek = getFirstDayOfWeek(getUILanguage()) % 7;

    // DatePicker works with timestamps that it renders in the browser's time zone, so a day is
    // handed over as midnight browser-local in both directions. That conversion is the only reason
    // this wrapper exists: a calendar selects a day, it has no time of day and no time zone.
    function toTimestamp(day: string): number | null {
        const parsed = parseDate(`${day} 00:00`); // the time part forces local time, see parseWithTimezone
        return parsed.isValid ? parsed.date.getTime() : null;
    }
    function toDay(timestamp: number): string {
        return formatLocalDate(new Date(timestamp)).split(' ')[0];
    }

    // fall back to today while no day is selected, so the calendar opens on the current month
    let pickerDate: number = $state(untrack(() => toTimestamp(selectedDay)) ?? Date.now());

    $effect(() => {
        const timestamp = toTimestamp(selectedDay);
        if (timestamp !== null) {
            pickerDate = timestamp;
        }
    });
</script>

<div class="datepicker-container">
    <DatePicker
        bind:startDate={pickerDate}
        onDateChange={() => onSelectDay(toDay(pickerDate))}
        enableFutureDates
        dowLabels={[
            m.dow_sunday(),
            m.dow_monday(),
            m.dow_tuesday(),
            m.dow_wednesday(),
            m.dow_thursday(),
            m.dow_friday(),
            m.dow_saturday(),
        ]}
        monthLabels={[
            m.january(),
            m.february(),
            m.march(),
            m.april(),
            m.may(),
            m.june(),
            m.july(),
            m.august(),
            m.september(),
            m.october(),
            m.november(),
            m.december(),
        ]}
        {startOfWeek}
        isOpen={true}
        alwaysShow={true}
        includeFont={false}
        theme="theme"
    />
</div>

<style>
    .datepicker-container {
        min-height: 206px; /** height of DatePicker for 6 weeks to avoid jumps */

        @media (min-width: 360px) {
            min-height: 230px;
        }
    }

    /* the 7 columns stretch across the available space, but days are centered in the column. adjust outside margin so days are aligned to left/right edge */
    :global(.datepicker[data-picker-theme="theme"] .month) {
        margin-inline: -8px;
    }

    /* Center each day's circle within its (wider) grid cell */
    :global(.datepicker[data-picker-theme="theme"] .date span) {
        margin-left: auto;
        margin-right: auto;
        transition: box-shadow var(--short-duration) var(--ease-out);
    }

    /* override some hard coded radii on start/end of range  */
    :global(.datepicker[data-picker-theme="theme"] .calendars-container .calendar .date.range.start.end span) {
        border-radius: 50%;
    }

    /* a day is a <button> wrapping the circle, and the circle is the control surface, so the
       button's own ring and outline are suppressed: a hovered or focused day shows one shape,
       not a rectangle around a circle. */
    :global(.datepicker[data-picker-theme="theme"] .date:hover) {
        box-shadow: none;
    }

    :global(.datepicker[data-picker-theme="theme"] .date:focus-visible) {
        box-shadow: none;
        /* biome-ignore lint/complexity/noImportantStyles: needed to override svelte-datepicker's chrome-specific style */
        outline: none !important;
    }

    :global(.datepicker[data-picker-theme="theme"] .date:focus-visible span) {
        outline: var(--focus-outline);
        /* the day grid leaves 1px between rows, so the usual 2px offset would collide */
        outline-offset: 1px;
    }

    /* svelte-datepicker gives the month and year buttons `5px auto -webkit-focus-ring-color`, which
       Chrome draws as a black double ring. Its own component styles carry Svelte's scoping classes,
       so the rule sits out of reach of plain specificity. */
    :global(.datepicker[data-picker-theme="theme"] header button:focus-visible) {
        /* biome-ignore lint/complexity/noImportantStyles: needed to override svelte-datepicker's chrome-specific style */
        outline: var(--focus-outline) !important;
        outline-offset: var(--focus-outline-offset);
    }

    /* The accent ring replaces the tinted circle a hovered day used to get. It hangs off the cell,
       not the circle: the whole cell is clickable, but the circle is narrower than the grid column. */
    :global(
        .datepicker[data-picker-theme="theme"]
            .date:not(.other):not(.disabled):not(.past):not(.future):not(.range):hover
            span
    ),
    :global(.datepicker[data-picker-theme="theme"] .date.range.start.end:hover span) {
        box-shadow: var(--ring);
    }

    /* for Japanese, add a suffix to the year*/
    :lang(ja) :global {
        .datepicker header span div:not(.years)::after {
            content: "年";
        }
    }

    :global(.datepicker[data-picker-theme="theme"]) {
        /**
         * Common Variables
         */
        /* only feeds --datepicker-calendar-split-border, a decorative rule */
        --datepicker-border-color: var(--divider-color);

        --datepicker-state-active: var(--primary-color);
        --datepicker-state-hover: color-mix(in srgb, var(--primary-color) 12%, white);

        --datepicker-color: var(--primary-color);
        --datepicker-font-family: var(--font-family);
        --datepicker-font-size-base: 1rem;

        --datepicker-spacing: 4px;

        --datepicker-margin-xsmall: calc(var(--datepicker-spacing) / 4);
        --datepicker-margin-small: calc(var(--datepicker-spacing) / 2);
        --datepicker-margin-base: var(--datepicker-spacing);
        --datepicker-margin-large: calc(var(--datepicker-spacing) * 2);
        --datepicker-margin-xlarge: calc(var(--datepicker-spacing) * 3);
        --datepicker-margin-xxlarge: calc(var(--datepicker-spacing) * 4);
        --datepicker-margin-xxxlarge: calc(var(--datepicker-spacing) * 5);
        --datepicker-margin-jumbo: calc(var(--datepicker-spacing) * 6);

        --datepicker-padding-xsmall: calc(var(--datepicker-spacing) / 4);
        --datepicker-padding-small: calc(var(--datepicker-spacing) / 2);
        --datepicker-padding-base: var(--datepicker-spacing);
        --datepicker-padding-large: calc(var(--datepicker-spacing) * 2);
        --datepicker-padding-xlarge: calc(var(--datepicker-spacing) * 3);
        --datepicker-padding-xxlarge: calc(var(--datepicker-spacing) * 4);
        --datepicker-padding-xxxlarge: calc(var(--datepicker-spacing) * 5);
        --datepicker-padding-jumbo: calc(var(--datepicker-spacing) * 6);

        /**
         * Container
         */
        --datepicker-container-background: none;
        --datepicker-container-border: none;
        --datepicker-container-box-shadow: none;
        --datepicker-container-font-family: var(--datepicker-font-family);
        --datepicker-container-position: relative;
        --datepicker-container-left: auto;
        --datepicker-container-top: auto;
        --datepicker-container-width: auto;
        --datepicker-container-zindex: auto;

        /**
         * Calendar
         */
        --datepicker-calendar-border: 0;
        --datepicker-calendar-padding: 0;
        --datepicker-calendar-position: relative;
        --datepicker-calendar-width: auto;

        --datepicker-calendar-split-border: 1px solid var(--datepicker-border-color);

        /**
         * Calendar Header
         */
        --datepicker-calendar-header-align-items: center;
        --datepicker-calendar-header-color: var(--datepicker-color);
        --datepicker-calendar-header-display: flex;
        --datepicker-calendar-header-font-size: var(--datepicker-font-size-large);
        --datepicker-calendar-header-justify-content: space-between;
        --datepicker-calendar-header-margin: 0;
        --datepicker-calendar-header-padding: var(--datepicker-padding-large) 8px;
        --datepicker-calendar-header-user-select: none;

        /**
         * Calendar Header Month Navigation
         */
        --datepicker-calendar-header-month-nav-background: transparent;
        --datepicker-calendar-header-month-nav-background-hover: transparent;
        --datepicker-calendar-header-month-nav-border: 0;
        --datepicker-calendar-header-month-nav-cursor: pointer;
        --datepicker-calendar-header-month-nav-border-radius: 50%;
        --datepicker-calendar-header-month-nav-color: var(--datepicker-color);
        --datepicker-calendar-header-month-nav-font-size: var(--datepicker-font-size-large);
        --datepicker-calendar-header-month-nav-height: 24px;
        --datepicker-calendar-header-month-nav-margin-left: -8px;
        --datepicker-calendar-header-month-nav-padding: var(--datepicker-padding-small);
        --datepicker-calendar-header-month-nav-text-align: center;
        --datepicker-calendar-header-month-nav-width: 24px;

        --datepicker-calendar-header-month-nav-icon-next-background-size: 16px 16px;
        --datepicker-calendar-header-month-nav-icon-next-filter: invert(0);
        --datepicker-calendar-header-month-nav-icon-next-height: 16px;
        --datepicker-calendar-header-month-nav-icon-next-margin: auto;
        --datepicker-calendar-header-month-nav-icon-next-width: 16px;

        --datepicker-calendar-header-month-nav-icon-prev-background-size: 16px 16px;
        --datepicker-calendar-header-month-nav-icon-prev-filter: invert(0);
        --datepicker-calendar-header-month-nav-icon-prev-height: 16px;
        --datepicker-calendar-header-month-nav-icon-prev-margin: auto;
        --datepicker-calendar-header-month-nav-icon-prev-width: 16px;

        /**
         * Calendar Header Text
         */
        --datepicker-calendar-header-text-align-items: center;
        --datepicker-calendar-header-text-color: var(--text-color);
        --datepicker-calendar-header-text-display: flex;
        --datepicker-calendar-header-text-font-size: inherit;
        --datepicker-calendar-header-text-font-weight: var(--datepicker-font-weight-medium);
        --datepicker-calendar-header-text-gap: var(--gap-small);

        /**
         * Calendar Header Year Navigation Container
         */
        --datepicker-calendar-header-year-align-items: center;
        --datepicker-calendar-header-year-display: flex;
        --datepicker-calendar-header-year-flex-direction: column;
        --datepicker-calendar-header-year-margin: 0;

        /**
         * Calendar Header Year Navigation Controls
         */
        --datepicker-calendar-header-year-nav-display: block;
        --datepicker-calendar-header-year-nav-color: var(--datepicker-color);
        --datepicker-calendar-header-year-nav-height: 12px;
        --datepicker-calendar-header-year-nav-line-height: 12px;
        --datepicker-calendar-header-year-nav-margin: -2px 0 0 0;
        --datepicker-calendar-header-year-nav-padding: 0;
        --datepicker-calendar-header-year-nav-width: 12px;
        --datepicker-calendar-header-year-nav-icon-font-size: 13px;

        --datepicker-calendar-header-year-nav-icon-next-background-size: 12px 12px;
        --datepicker-calendar-header-year-nav-icon-next-display: block;
        --datepicker-calendar-header-year-nav-icon-next-filter: invert(0);
        --datepicker-calendar-header-year-nav-icon-next-height: 12px;
        --datepicker-calendar-header-year-nav-icon-next-width: 12px;

        --datepicker-calendar-header-year-nav-icon-prev-background-size: 12px 12px;
        --datepicker-calendar-header-year-nav-icon-prev-display: block;
        --datepicker-calendar-header-year-nav-icon-prev-filter: invert(0);
        --datepicker-calendar-header-year-nav-icon-prev-height: 12px;
        --datepicker-calendar-header-year-nav-icon-prev-width: 12px;

        /**
         * Calendar DOW (Days of Week)
         */
        --datepicker-calendar-dow-color: var(--secondary-text-color);
        --datepicker-calendar-dow-font-size: var(--datepicker-font-size-base);
        --datepicker-calendar-dow-font-weight: var(--datepicker-font-weight-medium);
        --datepicker-calendar-dow-margin-bottom: var(--datepicker-margin-large);
        --datepicker-calendar-dow-text-align: center;

        /**
         * Calendar Month
         */
        --datepicker-calendar-container-display: grid;
        --datepicker-calendar-container-grid-template-columns: repeat(7, 1fr);
        --datepicker-calendar-container-grid-gap: 0;
        --datepicker-calendar-container-width: fit-content;

        /**
         * Calendar Day Container
         */
        --datepicker-calendar-day-container-appearance: none;
        --datepicker-calendar-day-container-background: inherit;
        --datepicker-calendar-day-container-border: 0;
        --datepicker-calendar-day-container-margin: 0;
        --datepicker-calendar-day-container-padding: 0;
        --datepicker-calendar-day-container-position: relative;
        --datepicker-calendar-day-container-text-align: center;

        /**
         * Calendar Day
         */
        --datepicker-calendar-day-align-items: center;
        --datepicker-calendar-day-background-hover: transparent;
        --datepicker-calendar-day-border: none;
        --datepicker-calendar-day-border-radius: 50%;
        --datepicker-calendar-day-color: var(--text-color);
        --datepicker-calendar-day-color-disabled: var(--secondary-text-color);
        --datepicker-calendar-day-color-hover: var(--text-color);
        --datepicker-calendar-day-cursor: pointer;
        --datepicker-calendar-day-cursor-disabled: default;
        --datepicker-calendar-day-display: flex;
        --datepicker-calendar-day-height: 2rem;
        --datepicker-calendar-day-width: 2rem;
        --datepicker-calendar-day-justify-content: center;
        --datepicker-calendar-day-font-family: var(--datepicker-font-family);
        --datepicker-calendar-day-font-size: var(--datepicker-font-size-base);
        --datepicker-calendar-day-margin-bottom: 1px;
        --datepicker-calendar-day-padding: 0;
        --datepicker-calendar-day-text-align: center;
        --datepicker-calendar-day-zindex-focus: 12;

        /**
         * Calendar Days Outside of Month
         */
        --datepicker-calendar-day-other-border: 0;
        --datepicker-calendar-day-other-box-shadow: none;
        --datepicker-calendar-day-other-color: var(--secondary-text-color);

        /**
         * Calendar Today
         */
        --datepicker-calendar-today-background: transparent;
        --datepicker-calendar-today-border: none;
        --datepicker-calendar-today-cursor: pointer;
        --datepicker-calendar-today-font-weight: var(--datepicker-font-weight-bold);
        /**
         * Calendar Range
         */
        --datepicker-calendar-range-background: var(--datepicker-state-hover);
        --datepicker-calendar-range-background-disabled: var(--datepicker-state-hover);
        --datepicker-calendar-range-border: 0;
        --datepicker-calendar-range-border-radius: 0;
        --datepicker-calendar-range-color: var(--datepicker-color);
        --datepicker-calendar-range-color-disabled: #ffc0b7;
        --datepicker-calendar-range-cursor: pointer;
        --datepicker-calendar-range-font-weight: var(--datepicker-font-weight-base);

        /**
         * Calendar Range Start & End
         */
        --datepicker-calendar-range-start-box-shadow: none;
        --datepicker-calendar-range-end-box-shadow: none;
        --datepicker-calendar-range-start-box-shadow-selected: none;
        --datepicker-calendar-range-end-box-shadow-selected: none;

        --datepicker-calendar-range-start-end-background: #f5f5f5;
        --datepicker-calendar-range-start-end-color: #232a32;

        /**
         * Calendar Range Selected
         */
        --datepicker-calendar-range-selected-background: var(--datepicker-state-active);
        --datepicker-calendar-range-selected-border-radius: 50%;
        --datepicker-calendar-range-selected-color: #fff;
        --datepicker-calendar-range-selected-font-weight: var(--datepicker-font-weight-medium);
        --datepicker-calendar-range-selected-start-border-radius: 50%;

        /**
         * Calendar Range Hover
         */
        --datepicker-calendar-range-included-background: #eceff1;
        --datepicker-calendar-range-included-box-shadow: none;
        --datepicker-calendar-range-included-color: #232a32;
        --datepicker-calendar-range-included-font-weight: var(--datepicker-font-weight-base);
        --datepicker-calendar-range-included-height: var(--datepicker-calendar-day-height);
    }
</style>
