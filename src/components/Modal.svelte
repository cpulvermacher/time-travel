<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        onClose?: () => void;
        closeOnCancel?: boolean;
    }
    const { children, onClose, closeOnCancel }: Props = $props();

    function show(node: HTMLDialogElement) {
        node.showModal();
    }
    function oncancel(event: Event) {
        // cancel can be cancelled
        // in Chrome pressing Esc multiple times will close the dialog anyway,
        // but since Esc closes the popup first we don't need to worry about that
        event.preventDefault();
        if (closeOnCancel) {
            onClose?.();
        }
    }
    function onDialogClick(event: MouseEvent) {
        if (!closeOnCancel) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target.tagName !== 'DIALOG') {
            return;
        }
        const dialogRect = target.getBoundingClientRect();

        const isOutsideClick =
            event.clientX < dialogRect.left ||
            event.clientX > dialogRect.right ||
            event.clientY < dialogRect.top ||
            event.clientY > dialogRect.bottom;
        if (isOutsideClick) {
            event.preventDefault();
            onClose?.();
        }
    }
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: onclick only dismisses on backdrop clicks, the keyboard is the close button -->
<dialog use:show {oncancel} onclose={onClose} onclick={onDialogClick} class="modal {onClose ? 'closable' : ''}">
    {#if onClose}
        <button type="button" class="close" onclick={onClose}>✕</button>
    {/if}
    {@render children?.()}
</dialog>

<style>
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
        padding: var(--main-padding);

        display: flex;
        gap: 20px;
        flex-direction: column;
        align-items: center;
        /* not center: content taller than max-height would overflow at the top, out of scroll reach */
        justify-content: flex-start;
        color: var(--text-color);
        background: white;
        /* the sheet spans the full width, so only the top and bottom edges are ever visible */
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        animation: fade-in 0.5s var(--ease-out);
    }
    .modal.closable {
        padding: 30px var(--main-padding);
    }

    ::backdrop {
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(5px);
    }

    .close {
        position: absolute;
        background: transparent;
        border: none;
        top: 2px;
        right: 2px;
        padding: 5px;
        width: 30px;
        height: 30px;
        font-size: 1.5em;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
