<script lang="ts">
    import { m } from '../paraglide/messages';
    import { getUILanguage } from '../util/browser';
    import { getTzInfo } from '../util/timezone-info';

    interface Props {
        date: Date | undefined;
        timezone: string; // IANA time zone identifier or '' for browser default
    }
    const { date, timezone }: Props = $props();

    const tzInfo = $derived(date !== undefined ? getTzInfo(getUILanguage(), date, timezone) : null);
    const offsetBadgeTitle = $derived.by(() => {
        let title = timezone || tzInfo?.tzName || '';

        if (title && tzInfo?.tzName !== title) {
            title += ` (${tzInfo?.tzName})`;
        }

        if (tzInfo?.isDst) {
            title += `\n${m.dst_info()}`;
        }
        return title;
    });
</script>

<div class={['preview', { active: date !== undefined }]}>
    {#if date === undefined}
        <div>{m.page_uses_real_date()}</div>
    {:else}
        <div class="label">{m.effective_page_date()}</div>
        {#if tzInfo}
            {#key date?.getTime()}
                <div class="time-block">
                    <div class="datetime">
                        {tzInfo?.dateString}
                        {tzInfo?.timeString}
                    </div>
                    {#if (timezone && tzInfo?.isYearWithDst) || tzInfo?.isOffsetDifferentFromNow}
                        <span class={{ badge: true, "badge--dst": tzInfo?.isDst }} title={offsetBadgeTitle}>
                            {tzInfo.offset}
                        </span>
                    {/if}
                </div>
            {/key}
        {/if}
    {/if}
</div>

<style>
    .preview {
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        justify-items: center;
        transition: all 0.3s ease-in-out;
    }
    .preview.active {
        color: var(--primary-color);
    }
    .label {
        font-size: 0.85rem;
    }
    .time-block {
        display: flex;
        gap: 5px;
        align-items: center;
        font-size: 1rem;
        animation: date-change 0.2s ease-in-out;
    }
    @keyframes date-change {
        from {
            opacity: 0;
            filter: blur(4px);
        }
        to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
        }
    }
    .datetime {
        font-weight: bold;
        font-size: 1.2rem;
    }
    .badge {
        background-color: rgba(255, 255, 255, 0.3);
        color: white;
        padding: 0 5px;
        border-radius: 8px;
        font-size: 0.8rem;
    }
    .badge--dst {
        background-color: orange;
    }
</style>
