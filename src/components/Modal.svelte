<script lang="ts">
    import type { Snippet } from 'svelte'

    interface Props {
        children: Snippet
        onClose?: () => void
        closeOnCancel?: boolean
    }
    const { children, onClose, closeOnCancel }: Props = $props()

    function show(node: HTMLDialogElement) {
        node.showModal()
    }
    function oncancel(event: Event) {
        // cancel can be cancelled
        // in Chrome pressing Esc multiple times will close the dialog anyway,
        // but since Esc closes the popup first we don't need to worry about that
        event.preventDefault()
        if (closeOnCancel) {
            onClose?.()
        }
    }
    function onDialogClick(event: MouseEvent) {
        if (!closeOnCancel) {
            return
        }

        const target = event.target as HTMLElement
        if (target.tagName !== 'DIALOG') {
            return
        }
        const dialogRect = target.getBoundingClientRect()

        const isOutsideClick =
            event.clientX < dialogRect.left ||
            event.clientX > dialogRect.right ||
            event.clientY < dialogRect.top ||
            event.clientY > dialogRect.bottom
        if (isOutsideClick) {
            event.preventDefault()
            onClose?.()
        }
    }
</script>

<dialog use:show {oncancel} onclose={onClose} onclick={onDialogClick} class="modal {onClose ? 'closable' : ''}">
    {#if onClose}
        <button class="close" onclick={onClose}>✕</button>
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
        padding: 25px 10px;

        display: flex;
        gap: 20px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-color);
        background: rgba(255, 255, 255, 0.8);
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        animation: fade-in 0.3s ease-in;
    }
    .modal.closable {
        padding: 30px 10px;
    }

    ::backdrop {
        background: rgba(255, 255, 255, 0.3);
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
