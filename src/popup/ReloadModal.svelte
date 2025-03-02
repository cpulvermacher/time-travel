<script lang="ts">
    import type { Action } from 'svelte/action'
    import { quartIn } from 'svelte/easing'
    import { fade } from 'svelte/transition'
    import { reloadTab } from '../util/browser'

    const focusButton: Action = (node) => {
        node.focus()
    }

    async function reload() {
        await reloadTab()
        window.close()
    }
    function show(node: HTMLDialogElement) {
        node.showModal()
    }
    function oncancel(event: Event) {
        event.preventDefault()
    }
</script>

<div class="background" transition:fade={{ duration: 300, easing: quartIn }}></div>
<dialog use:show {oncancel} class="modal" transition:fade={{ duration: 300, easing: quartIn }}>
    <p class="modal__text">Almost ready! Please reload the page for the changes to take effect.</p>
    <button use:focusButton onclick={reload}>Reload</button>
</dialog>

<style>
    .background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffffe0;
        backdrop-filter: blur(5px);
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: initial;
        max-width: none;
        background: none;
        border: none;
        margin: 0;
        padding: 0;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-color);
    }

    ::backdrop {
        display: none;
    }

    .modal__text {
        padding: 10px;
    }
</style>
