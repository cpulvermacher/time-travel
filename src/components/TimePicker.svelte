<script lang="ts">
    import { formatLocalTime, overwriteTimePart, parseDate } from '../util/date-utils'

    interface Props {
        value: string
        onChange?: () => void
    }
    let { value = $bindable() }: Props = $props()

    let parsedDate = $derived(parseDate(value))
    let localTime = $derived(parsedDate.isValid ? formatLocalTime(parsedDate.date) : '')

    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    function onChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        const input = event.target as HTMLInputElement
        if (!input.value) {
            return
        }

        let [hours, minutes] = input.value.split(':')
        const hoursNum = parseInt(hours, 10)
        const minutesNum = parseInt(minutes, 10)

        value = overwriteTimePart(value, hoursNum, minutesNum)
    }
</script>

{#if hasTouchScreen}
    <div class="icon">
        <input type="time" id="time-picker" class="time-input-icon" onchange={onChange} value={localTime} />
    </div>
{/if}

<style>
    .icon {
        background: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234A5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' %3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 80%;
    }

    input {
        width: 30px;
        height: 30px;
        opacity: 0;
    }

    /* --- WebKit-specific pseudo-elements to hide internal controls --- */

    input::-webkit-calendar-picker-indicator {
        background: none;
        display: block;
        opacity: 0;
    }

    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input::-webkit-clear-button {
        display: none;
    }

    input {
        -moz-appearance: none;
    }
</style>
