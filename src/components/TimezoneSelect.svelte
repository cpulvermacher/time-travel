<script lang="ts">
    import { m } from '../paraglide/messages.js'

    interface Props {
        value: string | undefined
        onSelect?: (timezone: string | undefined) => void
    }

    const { value, onSelect }: Props = $props()

    // Common timezone options
    // TODO add all usual TZ
    const timezoneOptions = [
        { value: '', label: m.timezone_browser_default() },
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'America/New_York (UTC-5/UTC-4)' },
        { value: 'America/Chicago', label: 'America/Chicago (UTC-6/UTC-5)' },
        { value: 'America/Denver', label: 'America/Denver (UTC-7/UTC-6)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8/UTC-7)' },
        { value: 'Europe/London', label: 'Europe/London (UTC/UTC+1)' },
        { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1/UTC+2)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1/UTC+2)' },
        { value: 'Europe/Moscow', label: 'Europe/Moscow (UTC+3)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
        { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10/UTC+11)' },
    ]

    function handleChange(event: Event) {
        const select = event.target as HTMLSelectElement
        const newValue = select.value ? select.value : undefined
        onSelect?.(newValue)
    }
</script>

<div class="timezone-select">
    <label>
        {m.timezone_selector_label()}
        <select value={value ?? ''} onchange={handleChange}>
            {#each timezoneOptions as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    </label>
</div>

<style>
    .timezone-select {
        margin-top: 5px;
    }

    select {
        width: 100%;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background-color: var(--input-bg-color);
        color: var(--text-color);
        margin-top: 4px;
    }

    label {
        display: flex;
        flex-direction: column;
        width: 100%;
        font-size: 0.9em;
    }
</style>
