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
    const timeZoneLabel = $derived.by(() => {
        if (!tzInfo || tzInfo.tzName === timezone) {
            return timezone;
        }
        return `${timezone} (${tzInfo?.tzName})`;
    });
</script>

<div class="preview">
    {#if date === undefined}
        {m.page_uses_real_date()}
    {:else}
        <div>{m.effective_page_date()}</div>
        {#if tzInfo}
            <div class="time-block">
                <div class="datetime">
                    {tzInfo?.dateString}
                    {tzInfo?.timeString}
                </div>
                {#if tzInfo?.isYearWithDst || tzInfo?.isOffsetDifferentFromNow}
                    <span
                        class={{ badge: true, "badge--dst": tzInfo?.isDst }}
                        title={tzInfo?.isDst ? m.dst_info() : undefined}
                    >
                        {tzInfo.offset}
                    </span>
                {/if}
            </div>
        {/if}
        <div>{timeZoneLabel}</div>
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
</style>
