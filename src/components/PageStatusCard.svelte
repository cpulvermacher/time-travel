<script lang="ts">
    import { m } from '../paraglide/messages';
    import Background from './Background.svelte';
    import DateTimePreview from './DateTimePreview.svelte';
    import Toggle from './Toggle.svelte';

    interface Props {
        effectiveDate: Date | undefined;
        effectiveTimezone: string;
        isEnabled: boolean;
        disabled: boolean;
        onChange: (checked: boolean) => void;
    }
    let { effectiveDate, effectiveTimezone, isEnabled = $bindable(), disabled, onChange }: Props = $props();
</script>

<div class="card">
    <Background {effectiveDate} />
    <div class="content">
        <Toggle bind:checked={isEnabled} {disabled} {onChange} label={m.enable_fake_date_toggle()} />
        <DateTimePreview date={effectiveDate} timezone={effectiveTimezone} />
    </div>
</div>

<style>
    .card {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .content {
        position: relative;
        z-index: 1;
        padding: 10px 12px;
    }
</style>
