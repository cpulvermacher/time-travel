<script lang="ts">
    import { m } from '../paraglide/messages';
    import { getUILanguage } from '../util/browser';
    import type { ParsedDate } from '../util/date-utils';
    import { getTzInfo } from '../util/timezone-info';

    interface Props {
        parsedDate: ParsedDate;
        timezone: string;
    }
    const { parsedDate, timezone }: Props = $props();

    const tzInfo = $derived(parsedDate.isValid ? getTzInfo(getUILanguage(), parsedDate.date, timezone) : null);
    const timeZoneLabel = $derived.by(() => {
        if (!tzInfo || tzInfo.tzName === timezone) {
            return timezone;
        }
        return `${timezone} (${tzInfo?.tzName})`;
    });
</script>

<div class="preview">
    <div class="timezone-label">{m.date_in_timezone_info()}</div>
    {#if tzInfo}
        <div class="time-block">
            <div class="datetime">{tzInfo?.dateString} {tzInfo?.timeString}</div>
            {#if tzInfo?.isYearWithDst || tzInfo?.isOffsetDifferentFromNow}
                <span
                    class={{ badge: true, 'badge--dst': tzInfo?.isDst }}
                    title={tzInfo?.isDst ? m.dst_info() : undefined}
                >
                    {tzInfo.offset}
                </span>
            {/if}
        </div>
    {/if}
    <div class="timezone-label">{timeZoneLabel}</div>
</div>

<style>
    .preview {
        min-height: 58px;
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
