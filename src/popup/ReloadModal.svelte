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
</script>

<div class="background" transition:fade={{ duration: 300, easing: quartIn }}></div>
<div class="modal" transition:fade={{ duration: 300, easing: quartIn }}>
    <p class="modal__text">Almost ready! Please reload the page for the changes to take effect.</p>
    <button use:focusButton onclick={reload}>Reload</button>
</div>

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

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .modal__text {
        padding: 10px;
    }
</style>
