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

{#if visible}
    <div class={'background'}></div>
{/if}
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
        transform-origin: bottom right;
        animation: rotateIn 0.3s ease-in;
    }

    @keyframes rotateIn {
        from {
            transform: rotate(90deg);
        }
        to {
            transform: rotate(0deg);
        }
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        max-height: 0;
        transition: opacity 1s;
        opacity: 0;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .modal.visible {
        height: 100%;
        max-height: initial;
        opacity: 1;
    }

    .modal__text {
        color: white;
        padding: 10px;
    }
</style>
