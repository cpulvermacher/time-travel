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

<div class="preview">
    {#if date === undefined}
        <div>
            {#if import.meta.env.DEV}
                <span class="mock-active">[mock]</span>
            {/if}
            {m.page_uses_real_date()}
        </div>
    {:else}
        <div>
            {#if import.meta.env.DEV}
                <span class="mock-active">[mock]</span>
            {/if}
            {m.effective_page_date()}
        </div>
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
        color: var(--secondary-text-color);
    }
    .time-block {
        display: flex;
        gap: 5px;
        align-items: center;
        color: var(--text-color);
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
    .badge {
        background-color: #9f9f9f;
        color: white;
        padding: 0 5px;
        border-radius: 8px;
        font-size: 0.8rem;
    }
    .badge--dst {
        background-color: orange;
    }
    .mock-active {
        color: #c026d3;
        font-weight: bold;
    }
</style>
