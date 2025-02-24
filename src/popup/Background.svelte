<script lang="ts">
    interface Props {
        desaturated: boolean
        rotating: boolean
    }
    const { desaturated, rotating }: Props = $props()
</script>

<div class={['background', { desaturated, rotating }]}></div>

<style>
    .background {
        position: absolute;
        z-index: -1;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background-image: url('../../images/icon-128.png');
        background-size: cover;
        filter: saturate(1) brightness(1.25) blur(35px);
        transition: filter 3s;
        animation: rotate-forward 20s linear infinite;
        animation-play-state: paused;
    }
    .background.desaturated {
        filter: saturate(0) brightness(1.3) blur(35px);
    }
    .background.rotating {
        animation-play-state: running;
    }

    @keyframes rotate-forward {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
