<script lang="ts">
    import { tick } from 'svelte';
    import { getTimezoneCity } from '@/display/timezone-info';
    import { addDays } from '@/util/date/addDays';
    import { formatLocalDate, formatUnambiguousDate, overwriteDatePart, overwriteTimePart } from '@/util/date/format';
    import { parseDate } from '@/util/date/parse';
    import { isAndroid } from '@/web-ext/browser';
    import { m } from '../paraglide/messages';
    import Calendar from './Calendar.svelte';
    import DateFormatInfo from './DateFormatInfo.svelte';
    import LinkButton from './LinkButton.svelte';
    import TimePicker from './TimePicker.svelte';

    interface Props {
        fakeDate: string;
        onEnterKey?: () => void;
        timezone?: string; // if set, the input is interpreted as local time in this zone
    }
    let { fakeDate = $bindable(), onEnterKey, timezone = '' }: Props = $props();
    let parsedDate = $derived(parseDate(fakeDate, timezone));
    // The input may denote an instant (a UNIX timestamp, or an explicit offset such as "Z"), so it is
    // normalized to the bare wall clock time of the selected time zone before the date part is read
    // or written. That string carries no offset, so both operations are purely symbolic.
    let localDateString = $derived(
        parsedDate.isValid ? formatLocalDate(parsedDate.date, { timezone, fullPrecision: true }) : fakeDate
    );
    // the day and the time of day the two pickers edit, each in the selected time zone
    let selectedDay = $derived(localDateString.split(' ')[0]);
    let selectedTime = $derived(localDateString.split(' ')[1]?.slice(0, 5) ?? ''); // "HH:mm"
    let showFormatHelp = $state(false);
    const inputId = $props.id();
    let inputRef: HTMLInputElement;
    let timePickerRef: TimePicker;

    function onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && onEnterKey) {
            event.preventDefault();
            onEnterKey();
            return;
        }

        if (!parsedDate.isValid) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) {
                adjustSeconds(-60 * 60);
            } else if (event.shiftKey) {
                adjustSeconds(-10 * 60);
            } else if (event.altKey) {
                adjustSeconds(-1);
            } else {
                adjustSeconds(-60);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) {
                adjustSeconds(60 * 60);
            } else if (event.shiftKey) {
                adjustSeconds(10 * 60);
            } else if (event.altKey) {
                adjustSeconds(1);
            } else {
                adjustSeconds(60);
            }
        } else if (event.key === 'PageUp') {
            event.preventDefault();
            adjustDays(1);
        } else if (event.key === 'PageDown') {
            event.preventDefault();
            adjustDays(-1);
        }
    }
    function focus(node: HTMLInputElement) {
        node.focus();
        node.setSelectionRange(-1, -1);
    }
    async function acceptPickerDay(day: string) {
        fakeDate = overwriteDatePart(localDateString, day);

        if (await isAndroid()) {
            // on Android, automatically open the time picker after selecting a date
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            timePickerRef?.showPicker();
        } else {
            // on desktop, select hh:mm (and everything afterwards)
            inputRef.focus();
            await tick(); // wait for next DOM update
            const dateAndTimeSeparator = fakeDate.indexOf(' ');
            inputRef.setSelectionRange(dateAndTimeSeparator + 1, -1);
        }
    }
    function acceptPickerTime(time: string) {
        fakeDate = overwriteTimePart(localDateString, time);
    }
    function adjustSeconds(seconds: number) {
        if (!parsedDate.isValid) {
            return;
        }
        // adjust the actual instant, so stepping over a DST transition of the selected time zone
        // moves the wall clock the way that time zone does. Within an hour repeated by a transition
        // an explicit offset is added, so every instant stays reachable (see formatUnambiguousDate).
        fakeDate = formatUnambiguousDate(new Date(parsedDate.date.getTime() + seconds * 1000), timezone, {
            fullPrecision: true,
        });
    }
    function adjustDays(days: number) {
        if (!parsedDate.isValid) {
            return;
        }
        // step the wall clock of the selected time zone instead of the instant, so a day step keeps
        // the time of day across a DST transition of that zone (see addDays).
        fakeDate = formatUnambiguousDate(addDays(parsedDate.date, days, timezone), timezone, {
            fullPrecision: true,
        });
    }
</script>

<div>
    <div class="label-row">
        <label for={inputId}>
            {timezone
                ? m.datetime_input_label_tz({
                      timezone: getTimezoneCity(timezone),
                  })
                : m.datetime_input_label()}
        </label>
        <LinkButton onClick={() => (showFormatHelp = true)}>{m.format_help_link()}</LinkButton>
    </div>
    <div class="input-fields">
        <input
            id={inputId}
            {onkeydown}
            bind:value={fakeDate}
            use:focus
            bind:this={inputRef}
            type="text"
            size="28"
            maxlength="32"
            placeholder={formatLocalDate(new Date(), { timezone })}
            spellcheck="false"
            class={{ error: !parsedDate.isValid && !parsedDate.isReset }}
        />
        <TimePicker {selectedTime} onSelectTime={acceptPickerTime} bind:this={timePickerRef} />
    </div>
    <Calendar {selectedDay} onSelectDay={acceptPickerDay} />
</div>

{#if showFormatHelp}
    <DateFormatInfo onClose={() => (showFormatHelp = false)} />
{/if}

<style>
    .label-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
    }
    /* keep the help link on one line, let the (possibly long) label text wrap instead */
    .label-row :global(.linkbutton) {
        flex-shrink: 0;
        white-space: nowrap;
    }
    .input-fields {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 5px;
    }
    input {
        width: 100%;
    }
    input.error {
        border-color: var(--error-color);
        outline: 1px solid var(--error-color);
        animation: pulse 1s;
    }
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 var(--error-color);
        }
        70% {
            box-shadow: 0 0 0 5px transparent;
        }
        100% {
            box-shadow: 0 0 0 0 transparent;
        }
    }
</style>
