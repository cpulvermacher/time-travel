<script lang="ts">
    import { m } from '../paraglide/messages'
    import { formatDateInTimezone } from '../util/common'
    import { getDstInfo, getOffset } from '../util/timezones'

    interface Props {
        fakeDate: string
        timezone: string
    }
    let { fakeDate, timezone }: Props = $props()

    const dstInfo = $derived(getDstInfo(fakeDate, timezone))
    const offset = $derived(getOffset('en', timezone, new Date(fakeDate)).replace('GMT', ''))
</script>

<span class="timezone-label">
    {m.date_in_timezone_info({
        timezone: timezone,
        date: formatDateInTimezone(new Date(fakeDate), timezone),
    })}
</span>
{#if dstInfo?.yearWithDst}
    <span class={{ badge: true, 'badge--dst': dstInfo?.isDst }} title={dstInfo?.isDst ? m.dst_info() : undefined}>
        {offset}
    </span>
{/if}

<style>
    .timezone-label {
        font-size: 0.9em;
        color: var(--secondary-text-color);
        margin-top: 5px;
    }
    .badge {
        background-color: #9f9f9f;
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 0.8em;
        margin-left: 5px;
    }
    .badge--dst {
        background-color: orange;
    }
</style>
