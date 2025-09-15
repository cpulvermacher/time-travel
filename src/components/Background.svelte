<script lang="ts">
    import { untrack } from 'svelte';

    interface Props {
        effectiveDate: Date | undefined;
    }
    const { effectiveDate }: Props = $props();

    let lastEffectiveDate = $state(effectiveDate);
    let numSpins: number | undefined = $state();
    let desaturated = $derived(effectiveDate === undefined);

    function calculateNumSpins(diffMs: number): number | undefined {
        if (diffMs === 0) {
            return undefined;
        } else {
            const sign = diffMs > 0 ? 1 : -1;
            const days = Math.abs(diffMs / 1000 / 60 / 60 / 24);
            if (days <= 30) {
                return sign * 1;
            } else if (days <= 365) {
                return sign * 2;
            } else {
                return sign * 3;
            }
        }
    }

    $effect(() => {
        const lastDate = untrack(() => lastEffectiveDate ?? new Date());
        const newDate = effectiveDate ?? new Date();
        if (isNaN(newDate.getTime()) || isNaN(lastDate.getTime())) {
            console.log('Invalid date in spin()', newDate, lastDate);
            return;
        }
        numSpins = calculateNumSpins(newDate.getTime() - lastDate.getTime());
        lastEffectiveDate = effectiveDate;
    });

    $effect(() => {
        // Reset spinState after finishing the animation
        if (numSpins === undefined) {
            return;
        }
        const id = setTimeout(() => {
            numSpins = undefined;
        }, 2000);
        return () => clearTimeout(id);
    });

    const spinForwards = $derived(numSpins && numSpins > 0);
    const spinBackwards = $derived(numSpins && numSpins < 0);
</script>

<div
    class={['background', { spinBackwards, spinForwards, desaturated }]}
    style="--num-spins: {Math.abs(numSpins || 1)}; --spin-duration: 2s;"
></div>

<style>
    .background {
        position: fixed;
        z-index: -1;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background-image: url('../../images/icon-128.png');
        background-size: cover;
        filter: saturate(1) brightness(1.25) blur(35px);
        transition: filter 3s;
    }
    .background.desaturated {
        filter: saturate(0) brightness(1.4) blur(35px);
    }
    .background.spinBackwards {
        transition:
            filter 3s,
            transform var(--spin-duration) ease-in-out;
        transform: rotate(calc(-360deg * var(--num-spins)));
    }
    .background.spinForwards {
        transition:
            filter 3s,
            transform var(--spin-duration) ease-in-out;
        transform: rotate(calc(360deg * var(--num-spins)));
    }
</style>
