<script lang="ts">
    import type { TzInfo } from '@/display/timezone-info';
    import { m } from '@/paraglide/messages';

    interface Props {
        tzInfo: TzInfo;
        timezone: string; // IANA time zone identifier or '' for browser default
    }
    const { tzInfo, timezone }: Props = $props();

    const title = $derived.by(() => {
        let title = timezone || tzInfo.tzName || '';

        if (title && tzInfo.tzName !== title) {
            title += ` (${tzInfo.tzName})`;
        }

        if (tzInfo.isDst) {
            title += `\n${m.dst_info()}`;
        } else if (tzInfo.isYearWithDst) {
            title += `\n${m.dst_other_time_info()}`;
        }

        if (tzInfo.previousTransition) {
            // this change led to the offset in the badge, so no need to mention the offset here
            title += `\n${m.offset_since({ dateTime: tzInfo.previousTransition.dateTimeString })}`;
        }
        if (tzInfo.nextTransition) {
            const { dateTimeString, offset } = tzInfo.nextTransition;
            title += `\n${m.offset_until({ dateTime: dateTimeString, offset })}`;
        }
        return title;
    });
</script>

<span class="badge" {title}>
    {#if tzInfo.isYearWithDst}
        <svg
            class={[
                "season-step",
                {
                    "season-step--dst": tzInfo.isDst,
                    "season-step--standard": !tzInfo.isDst,
                },
            ]}
            viewBox="0 0 12 12"
            aria-hidden="true"
        >
            <polyline points={tzInfo.isDst ? "1,8.5 6,8.5 6,3.5 11,3.5" : "1,3.5 6,3.5 6,8.5 11,8.5"} />
        </svg>
    {/if}
    {tzInfo.offset}
</span>

<style>
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
    /* The clock step of the DST transition: up into daylight saving time, down back to standard
       time; absent when the zone does not observe DST */
    .season-step {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .season-step--dst {
        color: var(--dst-color);
    }
    .season-step--standard {
        color: var(--standard-time-color);
    }
</style>
