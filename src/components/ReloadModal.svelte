<script lang="ts">
    import type { Action } from 'svelte/action';
    import { reloadTab } from '@/web-ext/browser';
    import { m } from '../paraglide/messages';
    import Modal from './Modal.svelte';

    const focusButton: Action = (node) => {
        node.focus();
    };

    async function reload() {
        await reloadTab();
        window.close();
    }
</script>

<Modal>
    <p>{m.please_reload_message()}</p>
    <button type="button" use:focusButton onclick={reload}>{m.reload_btn()}</button>
</Modal>

<style>
</style>
