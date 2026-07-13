<script lang="ts">
    import { m } from '../paraglide/messages';
    import type { PageClock } from '../popup/initial-state';
    import { getUILanguage } from '../util/browser';
    import { getTzInfo } from '../util/timezone-info';

    interface Props {
        clock: PageClock | undefined; // fake clock set in the page, undefined if the page uses the real date
        timezone: string; // IANA time zone identifier or '' for browser default
    }
    const { clock, timezone }: Props = $props();

    // real system time, ticking
    let now = $state(new Date());
    $effect(() => {
        const interval = setInterval(() => {
            now = new Date();
        }, 1000);
        return () => clearInterval(interval);
    });
    const realTzInfo = $derived(getTzInfo(getUILanguage(), now, ''));

    // while the clock runs, the page advances the fake date with real time (see fakeNowDate())
    const fakeNow = $derived.by(() => {
        if (clock === undefined || clock.tickStart === null) {
            return clock?.date;
        }
        // `now` is only sampled once a second, so it can still predate a just-applied `tickStart`
        const elapsed = Math.max(0, now.getTime() - clock.tickStart);
        return new Date(clock.date.getTime() + elapsed);
    });

    const tzInfo = $derived(fakeNow !== undefined ? getTzInfo(getUILanguage(), fakeNow, timezone) : null);

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

<div class={["preview", { active: clock !== undefined }]}>
    <div class="label">
        {clock === undefined
            ? m.page_uses_real_date()
            : m.effective_page_date()}
    </div>
    {#if clock === undefined}
        <div class="time-block real-time">
            <div class="datetime">
                {realTzInfo?.dateString}
                {realTzInfo?.timeString}
            </div>
        </div>
    {:else if tzInfo}
        {#key clock.date.getTime()}
            <div class="time-block">
                <div class="datetime">
                    {tzInfo.dateString}
                    {tzInfo.timeString}
                </div>
                {#if (timezone && tzInfo.isYearWithDst) || tzInfo.isOffsetDifferentFromNow}
                    <span class={{ badge: true, "badge--dst": tzInfo.isDst }} title={offsetBadgeTitle}>
                        {tzInfo.offset}
                    </span>
                {/if}
            </div>
        {/key}
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
    .real-time {
        color: var(--secondary-text-color);
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
