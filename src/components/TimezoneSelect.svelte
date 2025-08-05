<script lang="ts">
    import { m } from '../paraglide/messages'
    import { getUILanguage } from '../util/browser'
    import { getTimezoneOptions, type Timezone } from '../util/timezones'

    interface Props {
        value: string
        onSelect?: (timezone: string) => void
    }

    const { value, onSelect }: Props = $props()

    const timezoneOptions = getTimezoneOptions(getUILanguage())

    // Group options by their group attribute
    const groupedOptions = timezoneOptions.reduce(
        (groups, option) => {
            const group = option.group || ''
            if (!groups[group]) {
                groups[group] = []
            }
            groups[group].push(option)
            return groups
        },
        {} as Record<string, Timezone[]>
    )

    // Sort the group keys alphabetically, but ensure undefined is first
    const groupKeys = Object.keys(groupedOptions).sort((a, b) => {
        if (!a) return -1
        if (!b) return 1
        return a.localeCompare(b)
    })

    function onChange(event: Event) {
        const select = event.target as HTMLSelectElement
        onSelect?.(select.value)
    }
</script>

<label>
    {m.timezone_selector_label()}
    <select value={value ?? ''} onchange={onChange}>
        {#each groupKeys as groupName}
            <optgroup label={groupName || m.timezone_group_common()}>
                {#each groupedOptions[groupName] as option}
                    <option value={option.tz}>{option.label}</option>
                {/each}
            </optgroup>
        {/each}
    </select>
</label>

<style>
    label {
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        width: 100%;
        font-size: 0.9em;
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
</style>
