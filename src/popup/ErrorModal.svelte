<script lang="ts">
    import Modal from './Modal.svelte'

    interface Props {
        text: string
    }
    const { text }: Props = $props()
</script>

<Modal>
    <button class="close" onclick={() => window.close()}>✕</button>
    <p class="modal__text">{text}</p>
</Modal>

<style>
    .close {
        position: absolute;
        border: none;
        top: 0;
        right: 0;
        padding: 10px;
        width: 35px;
        height: 35px;
        font-size: 1.5em;
    }

    .modal__text {
        color: var(--error-color);
        padding: 10px;
    }
</style>
