<script lang="ts">
    import { m } from '../paraglide/messages';
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

<div class={["card", { active: effectiveDate !== undefined }]}>
    <div class="content">
        <Toggle
            bind:checked={isEnabled}
            {disabled}
            {onChange}
            label={m.enable_fake_date_toggle()}
            light={effectiveDate !== undefined}
        />
        <DateTimePreview date={effectiveDate} timezone={effectiveTimezone} />
    </div>
</div>

<style>
    .card {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease-in-out;
    }
    .card.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    .content {
        position: relative;
        z-index: 1;
        padding: 10px 12px;
    }
</style>
