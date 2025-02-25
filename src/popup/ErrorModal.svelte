<script lang="ts">
    import { quartIn } from 'svelte/easing'
    import { fade } from 'svelte/transition'

    interface Props {
        text: string
    }
    const { text }: Props = $props()
</script>

<div class="modal" transition:fade={{ duration: 500, easing: quartIn }}>
    <button class="close" onclick={() => window.close()}>✕</button>
    <p class="modal__text">{text}</p>
</div>

<style>
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
        background: white;
    }

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
