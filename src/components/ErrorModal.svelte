<script lang="ts">
    import Modal from './Modal.svelte'

    interface Props {
        text: string
    }
    const { text }: Props = $props()
</script>

<Modal onClose={() => window.close()}>
    <p class="modal__text">{text}</p>
</Modal>

<style>
    .modal__text {
        color: var(--error-color);
    }
</style>
