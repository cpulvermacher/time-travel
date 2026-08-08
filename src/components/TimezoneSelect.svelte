<script lang="ts">
    import { untrack } from 'svelte';
    import { cubicOut } from 'svelte/easing';
    import { slide } from 'svelte/transition';
    import {
        getTimezoneOffsets,
        getTimezoneOptions,
        type Timezone,
        TZGROUP_COMMON,
        TZGROUP_RECENT,
    } from '@/display/timezone-options';
    import { getUILanguage } from '@/web-ext/browser';
    import { m } from '../paraglide/messages';
    import Checkbox from './Checkbox.svelte';

    interface Props {
        value: string; // IANA time zone ID or '' when disabled
        onSelect: (timezone: string) => void;
        recentTimezones: string[];
        date?: Date; // date the UTC offsets are shown for, defaults to now
    }

    const { value: activeValue, onSelect, recentTimezones, date }: Props = $props();
    let isEnabled = $state(untrack(() => !!activeValue));
    let value = $state(untrack(() => activeValue || recentTimezones[0] || 'UTC'));

    function groupTimezones(timezoneOptions: Timezone[]) {
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
            if (!a || a === TZGROUP_RECENT) {
                return -1;
            }
            if (!b || b === TZGROUP_RECENT) {
                return 1;
            }
            return a.localeCompare(b);
        });

        return { keys: groupKeys, groups: groupedOptions };
    }

    // building these for hundreds of time zones takes some time. $derived is lazy, so nothing is computed
    // while the selector is collapsed, and the offsets are only recalculated when the shown date changes.
    const timezoneOptions = $derived(getTimezoneOptions(recentTimezones));
    const timezones = $derived(groupTimezones(timezoneOptions));
    const offsets = $derived(getTimezoneOffsets(getUILanguage(), date ?? new Date(), timezoneOptions));

    /** e.g. 'New York (UTC-05:00)', or just 'UTC' for time zones without a meaningful offset */
    function optionLabel(option: Timezone) {
        const offset = offsets[option.tz];
        return offset ? `${option.name} (${offset})` : option.name;
    }

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
    <Checkbox label={m.timezone_selector_label()} bind:checked={isEnabled} onChange={onToggle} />

    {#if isEnabled}
        <div class="select-row" transition:slide={{ duration: 150, easing: cubicOut }}>
            <select {value} onchange={onChange} disabled={!isEnabled}>
                {#each timezones.keys as group (group)}
                    <optgroup label={groupLabel(group)}>
                        {#each timezones.groups[group] as option (option.tz)}
                            <option value={option.tz}>{optionLabel(option)}</option>
                        {/each}
                    </optgroup>
                {/each}
            </select>
            <svg class="chevron" aria-hidden="true" viewBox="0 0 12 12">
                <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
        </div>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: var(--gap-small);
    }
    .select-row {
        --chevron-inset: 6px;
        --chevron-size: 12px;

        /* indented to the checkbox label above it, so it reads as belonging to it */
        padding-left: var(--checkbox-label-offset);
        /* the chevron is positioned against this; its right edge is the select's right edge */
        position: relative;
        display: flex;
    }
    select {
        width: 100%;
        /* hide native chevron */
        appearance: none;
        padding-right: calc(var(--chevron-inset) + var(--chevron-size) + 6px);
    }
    .chevron {
        position: absolute;
        right: var(--chevron-inset);
        top: 50%;
        translate: 0 -50%;
        width: var(--chevron-size);
        height: var(--chevron-size);
        pointer-events: none;
    }
    .select-row:has(select:disabled) {
        color: var(--secondary-text-color);
    }
    select:disabled {
        color: inherit;
    }
</style>
