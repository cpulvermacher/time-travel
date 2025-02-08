<script lang="ts">
    import { reloadTab } from '../util/browser'

    interface Props {
        visible: boolean
    }
    const { visible }: Props = $props()
    let buttonRef: HTMLButtonElement

    $effect(() => {
        if (visible) {
            buttonRef.focus()
        }
    })

    async function reload() {
        await reloadTab()
        window.close()
    }
</script>

<div class={['background', { visible }]}></div>
<div class={['modal', { visible }]}>
    <p class="modal__text">Almost ready! Please reload the page for the changes to take effect.</p>
    <button bind:this={buttonRef} onclick={reload}>Reload</button>
</div>

<style>
    .background {
        position: absolute;
        top: 0;
        left: -50%;
        width: 150%;
        height: 100%;
        background: radial-gradient(#8080fd, var(--primary-color));
        transform: rotate(90deg);
        transform-origin: bottom right;
        transition: transform 0.3s ease-in;
    }

    .background.visible {
        transform: rotate(0deg);
    }

    .modal {
        position: fixed;
        top: 150%;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 0;
        transition: opacity 1s;
        opacity: 0;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .modal.visible {
        top: 0;
        max-height: initial;
        opacity: 1;
    }

    .modal__text {
        color: white;
        padding: 10px;
    }
</style>
