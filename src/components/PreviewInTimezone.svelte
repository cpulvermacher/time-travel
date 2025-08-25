<script lang="ts">
    import { m } from '../paraglide/messages'
    import { getUILanguage } from '../util/browser'
    import { getTzInfo } from '../util/timezone-info'

    interface Props {
        fakeDate: string
        timezone: string
        isValid: boolean
    }
    let { fakeDate, timezone, isValid }: Props = $props()

    const tzInfo = $derived(getTzInfo(getUILanguage(), fakeDate, timezone))
</script>

<div class="preview">
    <div class="timezone-label">
        {m.date_in_timezone_info({
            timezone: `${timezone} (${tzInfo?.tzName})`,
        })}
    </div>
    {#if isValid}
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
</div>

<style>
    .preview {
        height: 2em;
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
    }
    .badge {
        background-color: #9f9f9f;
        color: white;
        padding: 0 5px;
        border-radius: 8px;
        font-size: 0.8em;
    }
    .badge--dst {
        background-color: orange;
    }
</style>
