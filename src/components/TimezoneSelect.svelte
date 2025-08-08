<script lang="ts">
    import { onMount } from 'svelte'
    import { m } from '../paraglide/messages'
    import { getUILanguage, loadSetting } from '../util/browser'
    import { getTimezoneOptions, type Timezone } from '../util/timezone-info'

    interface Props {
        value: string
        onSelect?: (timezone: string) => void
    }

    const { value, onSelect }: Props = $props()

    let timezones: { keys: string[]; groups: Record<string, Timezone[]> } | null = $state(null)

    // generating this list for hundreds of timezones takes some time, do it after first render
    onMount(async () => {
        const history = await loadSetting('recentTimezones', [])

        const timezoneOptions = getTimezoneOptions(getUILanguage(), history)

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

        timezones = { keys: groupKeys, groups: groupedOptions }
    })

    function groupLabel(key: string) {
        if (key === '_common') {
            return m.timezone_group_common()
        } else if (key === '_recent') {
            return m.timezone_group_recent()
        } else {
            return key
        }
    }

    function onChange(event: Event) {
        const select = event.target as HTMLSelectElement
        onSelect?.(select.value)
    }
</script>

<label>
    {m.timezone_selector_label()}
    {#if !timezones}
        <div>...</div>
    {:else}
        <select value={value ?? ''} onchange={onChange}>
            {#each timezones.keys as group}
                <optgroup label={groupLabel(group)}>
                    {#each timezones.groups[group] as option}
                        <option value={option.tz}>{option.label}</option>
                    {/each}
                </optgroup>
            {/each}
        </select>
    {/if}
</label>

<style>
    select {
        width: 100%;
        padding: 5px 10px;
        margin-top: 5px;
        border-radius: 3px;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text-color);
    }
</style>
