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
        top: 2px;
        right: 2px;
        padding: 5px;
        width: 30px;
        height: 30px;
        font-size: 1.5em;
    }

    .modal__text {
        color: var(--error-color);
        margin: 15px 0;
    }
</style>
