<script lang="ts">
    import { DatePicker } from '@svelte-plugins/datepicker'
    import { tick } from 'svelte'
    import { formatLocalTime, overwriteDatePart } from '../util/common'

    interface Props {
        fakeDate: string
        onEnterKey?: () => void
    }
    let { fakeDate = $bindable(), onEnterKey }: Props = $props()
    let isOpen = $state(false)
    // Note: the datepicker internally works with timestamps in UTC.
    let pickerDate = $state(Date.parse(fakeDate))
    let inputRef: HTMLInputElement

    function onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && onEnterKey) {
            event.preventDefault()
            isOpen = false
            onEnterKey()
        }
    }
    function focus(node: HTMLInputElement) {
        node.focus()
        node.setSelectionRange(-1, -1)
    }
    async function toggleDatePicker() {
        isOpen = !isOpen
        if (isOpen) {
            // when opening the date picker, force to standard format and allow editing the current date entered
            let inputDateTimestamp = Date.parse(fakeDate)
            if (isNaN(inputDateTimestamp)) {
                // if date in input field is invalid, reset
                const newDate = new Date()
                fakeDate = formatLocalTime(newDate)
                inputDateTimestamp = newDate.getTime()
            } else {
                fakeDate = formatLocalTime(new Date(fakeDate), { fullPrecision: true })
            }
            pickerDate = inputDateTimestamp

            inputRef.focus()
            await tick() // wait for next DOM update
            inputRef.setSelectionRange(0, 10)
        }
    }
    async function acceptPickerDate() {
        const newDate = new Date(pickerDate)
        fakeDate = overwriteDatePart(fakeDate, newDate)

        inputRef.focus()
        await tick() // wait for next DOM update
        inputRef.setSelectionRange(11, -1) // select hh:mm (and everything afterwards)
    }
    function onInput() {
        if (isOpen) {
            // update pickerDate when input field is edited
            let inputDateTimestamp = Date.parse(fakeDate)
            if (!isNaN(inputDateTimestamp)) {
                pickerDate = inputDateTimestamp
            }
        }
    }
</script>

<DatePicker
    bind:isOpen
    bind:startDate={pickerDate}
    onDateChange={acceptPickerDate}
    enableFutureDates
    includeFont={false}
    theme="theme"
>
    <input
        {onkeydown}
        bind:value={fakeDate}
        use:focus
        bind:this={inputRef}
        oninput={onInput}
        type="text"
        size="28"
        maxlength="28"
        spellcheck="false"
    />
    <button onclick={toggleDatePicker} title="Choose date" aria-label="Choose date" class="calendar-icon"></button>
</DatePicker>

<style>
    input {
        width: 20ch;
        padding: 5px;
        padding-left: 21px;
        margin-top: 5px;
        color: var(--text-color);
        background: white;
        border: 1px solid #9f9f9f;
        border-radius: 3px;
    }

    .calendar-icon {
        position: absolute;
        left: 5px;
        top: 11px;
        background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEmSURBVHgB7ZcPzcIwEMUfXz4BSCgKwAGgACRMAg6YBBxsOMABOAAHFAXgAK5Z2Y6lHbfQ8SfpL3lZaY/1rb01N+BHUKSMNBfEJjZWISA56Uo6C2KvVpkgFn9oRx9vICFtUT1JKO3tvRtZdjBxXQs+YY+1FenIfuesPUGVVLzfRWKvmrSzbbN19wS+kAb2+sCEuUxrYzkbe4YvCVM2Vr5NPAkVa+van7Wn38U95uTpN5TJ/A8ZKemAakmbmJJGpI0gVmwA0huieFItjG19DgTHtwIZhCfZq3ztCuzQYh+FKBSvusjAGs8PnLYkLgMf34JoIBqIBqKBaIAb0Kw9RlhMCTbzzPWAqYq7LsuPaGDUsYmznaOk5zChUJTNQ4TFVMkrOL4HPsoNn26PxROHCggAAAAASUVORK5CYII=)
            no-repeat center center;
        background-size: 14px 14px;
        height: 14px;
        width: 14px;
        border: none;
        padding: 0;
    }

    /* Reset button styles */
    :global(.datepicker button) {
        height: unset;
    }
    :global(.datepicker button:focus) {
        outline: none;
    }

    :global(.datepicker[data-picker-theme='theme']) {
        /**
   * Common Variables
   */
        --datepicker-border-color: #e8e9ea;

        --datepicker-border-radius-small: 0.125rem;
        --datepicker-border-radius-base: 0.25rem;
        --datepicker-border-radius-large: 0.5rem;
        --datepicker-border-radius-xlarge: 0.75rem;
        --datepicker-border-radius-xxlarge: 1rem;
        --datepicker-border-radius-xxxlarge: 1.125rem;

        --datepicker-state-active: #6060f4;
        --datepicker-state-hover: #e7f7fc;

        --datepicker-color: #6060f4;

        --datepicker-font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;

        --datepicker-font-size-jumbo: 1.75rem;
        --datepicker-font-size-xxxlarge: 1.5rem;
        --datepicker-font-size-xxlarge: 1.375rem;
        --datepicker-font-size-xlarge: 1.25rem;
        --datepicker-font-size-large: 1.125rem;
        --datepicker-font-size-base: 12px;
        --datepicker-font-size-medium: 0.89rem;
        --datepicker-font-size-small: 0.75rem;
        --datepicker-font-size-xsmall: 0.625rem;
        --datepicker-font-size-xxsmall: 0.5rem;
        --datepicker-font-size-xxxsmall: 0.375rem;
        --datepicker-font-weight-thin: 100;
        --datepicker-font-weight-light: 300;
        --datepicker-font-weight-base: 400;
        --datepicker-font-weight-medium: 500;
        --datepicker-font-weight-bold: 700;
        --datepicker-font-weight-black: 900;

        --datepicker-spacing: 5px;

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
        --datepicker-container-background: #fff;
        --datepicker-container-border: 1px solid var(--datepicker-border-color);
        --datepicker-container-border-radius: 12px;
        --datepicker-container-box-shadow: 0 1px 20px rgba(0, 0, 0, 0.1);
        --datepicker-container-font-family: var(--datepicker-font-family);
        --datepicker-container-left: -20px;
        --datepicker-container-position: absolute;
        --datepicker-container-top: 105%;
        --datepicker-container-width: fit-content;
        --datepicker-container-zindex: 99;

        /**
   * Calendar
   */
        --datepicker-calendar-border: 0;
        --datepicker-calendar-padding: var(--datepicker-padding-base) var(--datepicker-padding-large)
            var(--datepicker-padding-xlarge);
        --datepicker-calendar-position: relative;
        --datepicker-calendar-width: 240px;

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
        --datepicker-calendar-header-padding: var(--datepicker-padding-large) var(--datepicker-padding-base);
        --datepicker-calendar-header-user-select: none;

        /**
   * Calendar Header Month Navigation
   */
        --datepicker-calendar-header-month-nav-background: transparent;
        --datepicker-calendar-header-month-nav-background-hover: transparent;
        --datepicker-calendar-header-month-nav-border: 0;
        --datepicker-calendar-header-month-nav-cursor: pointer;
        --datepicker-calendar-header-month-nav-border-radius: 3px;
        --datepicker-calendar-header-month-nav-color: var(--datepicker-color);
        --datepicker-calendar-header-month-nav-cursor: pointer;
        --datepicker-calendar-header-month-nav-font-size: var(--datepicker-font-size-large);
        --datepicker-calendar-header-month-nav-height: 32px;
        --datepicker-calendar-header-month-nav-margin-left: -8px;
        --datepicker-calendar-header-month-nav-padding: var(--datepicker-padding-small);
        --datepicker-calendar-header-month-nav-text-align: center;
        --datepicker-calendar-header-month-nav-width: 32px;

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
        --datepicker-calendar-header-text-color: var(--datepicker-color);
        --datepicker-calendar-header-text-display: flex;
        --datepicker-calendar-header-text-font-size: inherit;
        --datepicker-calendar-header-text-font-weight: var(--datepicker-font-weight-medium);
        --datepicker-calendar-header-text-gap: 8px;

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
        --datepicker-calendar-dow-color: #8b9198;
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
        --datepicker-calendar-day-border: 1px solid transparent;
        --datepicker-calendar-day-border: 1px solid transparent;
        --datepicker-calendar-day-border-radius: 20px;
        --datepicker-calendar-day-color: #232a32;
        --datepicker-calendar-day-color-disabled: #b9bdc1;
        --datepicker-calendar-day-color-hover: #232a32;
        --datepicker-calendar-day-cursor: pointer;
        --datepicker-calendar-day-cursor-disabled: default;
        --datepicker-calendar-day-display: flex;
        --datepicker-calendar-day-height: 20px;
        --datepicker-calendar-day-justify-content: center;
        --datepicker-calendar-day-font-family: var(--datepicker-font-family);
        --datepicker-calendar-day-font-size: var(--datepicker-font-size-base);
        --datepicker-calendar-day-margin-bottom: 1px;
        --datepicker-calendar-day-padding: var(--datepicker-padding-base);
        --datepicker-calendar-day-text-align: center;
        --datepicker-calendar-day-width: 20px;
        --datepicker-calendar-day-zindex-focus: 12;

        /**
   * Calendar Days Outside of Month
   */
        --datepicker-calendar-day-other-border: 0;
        --datepicker-calendar-day-other-box-shadow: none;
        --datepicker-calendar-day-other-color: #d1d3d6;

        /**
   * Calendar Today
   */
        --datepicker-calendar-today-background: transparent;
        --datepicker-calendar-today-border: 1px solid #232a32;
        --datepicker-calendar-today-cursor: default;
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
        --datepicker-calendar-range-cursor: default;
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
        --datepicker-calendar-range-selected-border-radius: 20px;
        --datepicker-calendar-range-selected-color: #fff;
        --datepicker-calendar-range-selected-font-weight: var(--datepicker-font-weight-medium);
        --datepicker-calendar-range-selected-start-border-radius: 20px;

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
