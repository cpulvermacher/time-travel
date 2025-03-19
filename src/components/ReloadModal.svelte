<script lang="ts">
    import type { Action } from 'svelte/action'
    import { m } from '../paraglide/messages'
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
    <p>{m.please_reload_message()}</p>
    <button use:focusButton onclick={reload}>{m.reload_btn()}</button>
</Modal>

<style>
</style>
