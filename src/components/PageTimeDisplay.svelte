<script lang="ts">
    import { getTzInfo } from '@/display/timezone-info';
    import { getUILanguage } from '@/web-ext/browser';
    import { m } from '../paraglide/messages';
    import type { PageClock } from '../popup/initial-state';

    interface Props {
        clock: PageClock | undefined; // fake clock set in the page, undefined if the page uses the real date
        timezone: string; // IANA time zone identifier or '' for browser default
    }
    const { clock, timezone }: Props = $props();

    // the display only moves while the real date shows, or while the fake clock ticks; a frozen fake clock needs no timer
    const isTicking = $derived(clock === undefined || clock.tickStart !== null);

    // real system time, sampled faster than once a second so the ticking seconds don't visibly skip
    let now = $state(new Date());
    $effect(() => {
        if (!isTicking) {
            return;
        }
        const interval = setInterval(() => {
            now = new Date();
        }, 250);
        return () => clearInterval(interval);
    });
    const realTzInfo = $derived(getTzInfo(getUILanguage(), now, ''));

    // while the clock runs, the page advances the fake date with real time (see fakeNowDate())
    const fakeNow = $derived.by(() => {
        if (clock === undefined || clock.tickStart === null) {
            return clock?.date;
        }
        // `now` is only sampled periodically, so it can still predate a just-applied `tickStart`
        const elapsed = Math.max(0, now.getTime() - clock.tickStart);
        return new Date(clock.date.getTime() + elapsed);
    });

    // the fake date shows seconds, so a running clock is visibly alive and a stopped one visibly still
    const tzInfo = $derived(
        fakeNow !== undefined ? getTzInfo(getUILanguage(), fakeNow, timezone, { seconds: true }) : null
    );

    const offsetBadgeTitle = $derived.by(() => {
        let title = timezone || tzInfo?.tzName || '';

        if (title && tzInfo?.tzName !== title) {
            title += ` (${tzInfo?.tzName})`;
        }

        if (tzInfo?.isDst) {
            title += `\n${m.dst_info()}`;
        } else if (tzInfo?.isYearWithDst) {
            title += `\n${m.dst_other_time_info()}`;
        }
        return title;
    });
</script>

<div class={["page-time", { active: clock !== undefined }]}>
    <div class="label">{m.page_sees_label()}</div>
    {#if clock === undefined}
        <div class="time-block real-time">
            <div class="datetime">
                {realTzInfo?.dateString}
                {realTzInfo?.timeString}
            </div>
            <span class="note">· {m.real_time_note()}</span>
        </div>
    {:else if tzInfo}
        {#key clock.date.getTime()}
            <div class="time-block">
                <div class="datetime">
                    {tzInfo.dateString}
                    {tzInfo.timeString}
                </div>
                {#if timezone || tzInfo.isOffsetDifferentFromNow}
                    <span class="badge" title={offsetBadgeTitle}>
                        {#if tzInfo.isYearWithDst}
                            <span
                                class={[
                                    "season-dot",
                                    {
                                        "season-dot--dst": tzInfo.isDst,
                                        "season-dot--standard": !tzInfo.isDst,
                                    },
                                ]}
                                role="img"
                                aria-label={offsetBadgeTitle}
                            ></span>
                        {/if}
                        {tzInfo.offset}
                    </span>
                {/if}
            </div>
        {/key}
    {/if}
</div>

<style>
    .page-time {
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        justify-items: center;
        transition: color var(--long-duration) ease-in-out;
    }
    .page-time.active {
        color: var(--primary-color);
    }
    .label {
        font-size: 1rem;
    }
    .real-time {
        color: var(--secondary-text-color);
    }
    .note {
        white-space: nowrap;
    }
    .time-block {
        display: flex;
        gap: 5px;
        font-size: 1rem;
        animation: date-change var(--long-duration) var(--ease-out);
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
        font-size: 1rem;
        font-variant-numeric: tabular-nums;
    }
    .badge {
        align-self: center;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--primary-color);
        border: 1px solid color-mix(in srgb, var(--primary-color) 35%, white);
        padding: 0 5px;
        border-radius: 8px;
        font-size: 0.8rem;
    }
    /* One hue, two fills: filled while DST is in effect, hollow while the zone is on standard time,
       absent when the zone never observes DST. Fill survives at 8px where a second hue would not. */
    .season-dot {
        box-sizing: border-box;
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        border: 1.5px solid var(--primary-color);
        border-radius: 50%;
    }
    .season-dot--dst {
        background-color: var(--primary-color);
    }
    .season-dot--standard {
        background-color: transparent;
    }
</style>
