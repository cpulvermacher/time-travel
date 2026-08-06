<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        onClick: () => void;
    }
    const { onClick, children }: Props = $props();
</script>

<button type="button" class="linkbutton" onclick={onClick}>{@render children?.()}</button>

<style>
    /* a button that looks like a link */
    .linkbutton {
        display: inline;
        background: none;
        border: none;
        border-radius: 0;
        color: var(--primary-color);
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
        text-decoration-color: var(--divider-color);
        font: inherit;
    }
    .linkbutton:hover {
        text-decoration-color: currentColor;
        /* the global button hover shadow makes no sense for a link */
        filter: none;
    }
</style>
