<script lang="ts">
    import type { Snippet } from 'svelte'
    import { quartIn } from 'svelte/easing'
    import { fade } from 'svelte/transition'

    interface Props {
        children: Snippet
        onClose?: () => void
    }
    const { children, onClose }: Props = $props()

    function show(node: HTMLDialogElement) {
        node.showModal()
    }
    function oncancel(event: Event) {
        event.preventDefault()
    }
</script>

<div class="background" transition:fade={{ duration: 300, easing: quartIn }}></div>
<dialog use:show {oncancel} class="modal" transition:fade={{ duration: 300, easing: quartIn }}>
    {#if onClose}
        <button class="close" onclick={onClose}>✕</button>
    {/if}
    {@render children?.()}
</dialog>

<style>
    .background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(5px);
    }

    .modal {
        position: fixed;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 100%;
        height: fit-content;
        max-width: 100%;
        max-height: 90%;
        border: none;
        box-sizing: border-box;
        margin: 0;
        padding: 20px 10px;

        display: flex;
        gap: 20px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-color);
        background: rgba(255, 255, 255, 0.8);
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }

    ::backdrop {
        display: none;
    }

    .close {
        position: absolute;
        border: none;
        top: 2px;
        right: 2px;
        padding: 5px;
        width: 30px;
        height: 30px;
        font-size: 1.5em;
    }
</style>
