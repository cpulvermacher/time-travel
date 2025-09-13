<script lang="ts">
    import { onMount } from 'svelte';
    import { m } from '../paraglide/messages';
    import { getUILanguage } from '../util/browser';
    import { getTimezoneOptions, TZGROUP_COMMON, TZGROUP_RECENT, type Timezone } from '../util/timezone-info';
    import Toggle from './Toggle.svelte';

    interface Props {
        value: string; // IANA time zone ID or '' when disabled
        onSelect: (timezone: string) => void;
        recentTimezones: string[];
    }

    const { value: activeValue, onSelect, recentTimezones }: Props = $props();
    let isEnabled = $state(!!activeValue);
    let value = $state(activeValue || recentTimezones[0] || 'UTC');

    let timezones: { keys: string[]; groups: Record<string, Timezone[]> } | null = $state(null);

    // generating this list for hundreds of timezones takes some time, do it after first render
    onMount(() => {
        const timezoneOptions = getTimezoneOptions(getUILanguage(), recentTimezones);

        // Group options by their group attribute
        const groupedOptions = timezoneOptions.reduce(
            (groups, option) => {
                const group = option.group || '';
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(option);
                return groups;
            },
            {} as Record<string, Timezone[]>
        );

        // Sort the group keys alphabetically, but ensure recent group is first
        const groupKeys = Object.keys(groupedOptions).sort((a, b) => {
            if (!a || a === TZGROUP_RECENT) return -1;
            if (!b || b === TZGROUP_RECENT) return 1;
            return a.localeCompare(b);
        });

        timezones = { keys: groupKeys, groups: groupedOptions };
    });

    function groupLabel(key: string) {
        if (key === TZGROUP_COMMON) {
            return m.timezone_group_common();
        } else if (key === TZGROUP_RECENT) {
            return m.timezone_group_recent();
        } else {
            return key;
        }
    }

    function onChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        value = select.value;
        onSelect?.(select.value);
    }
    function onToggle() {
        onSelect(isEnabled ? value : '');
    }
</script>

<div class="container">
    <Toggle label={m.timezone_selector_label()} bind:checked={isEnabled} onChange={onToggle} />

    {#if !timezones}
        <select disabled></select>
    {:else}
        <select {value} onchange={onChange} disabled={!isEnabled}>
            {#each timezones.keys as group}
                <optgroup label={groupLabel(group)}>
                    {#each timezones.groups[group] as option}
                        <option value={option.tz}>{option.label}</option>
                    {/each}
                </optgroup>
            {/each}
        </select>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    select {
        width: 100%;
        padding: 5px 8px;
        border-radius: 3px;
        border: 1px solid var(--border-color);
        background: white;
        color: var(--text-color);
        transition: filter 0.3s ease-in;
    }
    select:disabled {
        color: var(--secondary-text-color);
    }
    select:not(:disabled):hover {
        filter: drop-shadow(0 0 2px var(--primary-color));
        cursor: pointer;
    }
</style>
