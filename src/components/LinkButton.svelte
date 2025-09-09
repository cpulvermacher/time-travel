<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        onClick: () => void;
    }
    const { onClick, children }: Props = $props();

    // Not using <button> to allow using it as a secondary action in a <label>
    // (without being triggered when the label is clicked)
    function onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onClick();
        }
    }
    function onclick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        onClick();
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_missing_attribute -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<a tabindex="0" class="linkbutton" {onclick} {onkeydown}>
    {@render children?.()}
</a>

<style>
    .linkbutton {
        display: inline;
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: 0;
        font: inherit;
        text-decoration: underline;
    }
</style>
