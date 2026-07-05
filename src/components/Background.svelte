<script lang="ts">
    import { untrack } from 'svelte';
    import { debugLog } from '../util/log';

    interface Props {
        effectiveDate: Date | undefined;
    }
    const props: Props = $props();
    const effectiveDate = $derived(props.effectiveDate);

    let lastEffectiveDate = $state(untrack(() => effectiveDate));
    let rotation = $state(0);
    let desaturated = $derived(effectiveDate === undefined);

    function calculateSpinAngle(diffMs: number): number {
        const sign = diffMs > 0 ? 1 : -1;
        const days = Math.abs(diffMs / 1000 / 60 / 60 / 24);
        if (days <= 30) {
            return sign * 120;
        } else if (days <= 365) {
            return sign * 240;
        } else {
            return sign * 360;
        }
    }

    $effect(() => {
        const lastDate = untrack(() => lastEffectiveDate ?? new Date());
        const newDate = effectiveDate ?? new Date();
        if (Number.isNaN(newDate.getTime()) || Number.isNaN(lastDate.getTime())) {
            debugLog('Invalid date in spin()', newDate, lastDate);
            return;
        }
        const diffMs = newDate.getTime() - lastDate.getTime();
        if (diffMs !== 0) {
            rotation += calculateSpinAngle(diffMs);
        }
        lastEffectiveDate = effectiveDate;
    });
</script>

<div class={['background', { desaturated }]} style="transform: rotate({rotation}deg);"></div>

<style>
    .background {
        position: absolute;
        z-index: -1;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background-image: url("../../images/icon-128.png");
        background-size: cover;
        filter: saturate(1) brightness(1.25) blur(35px);
        transition:
            filter 3s,
            transform 2s ease-in-out;
    }
    .background.desaturated {
        filter: saturate(0) brightness(1.4) blur(35px);
    }
</style>
