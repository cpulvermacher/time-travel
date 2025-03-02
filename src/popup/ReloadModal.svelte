<script lang="ts">
    import type { Action } from 'svelte/action'
    import { reloadTab } from '../util/browser'
    import Modal from './Modal.svelte'

    const focusButton: Action = (node) => {
        node.focus()
    }

    async function reload() {
        await reloadTab()
        window.close()
    }
</script>

<Modal>
    <p class="modal__text">Almost ready! Please reload the page for the changes to take effect.</p>
    <button use:focusButton onclick={reload}>Reload</button>
</Modal>

<style>
    .modal__text {
        padding: 10px;
    }
</style>
