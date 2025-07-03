<script lang="ts">
    import type { Snippet } from 'svelte'

    interface Props {
        title: string
        children: Snippet
        open?: boolean
        onToggle?: (open: boolean) => void
    }
    const { title, children, open, onToggle }: Props = $props()
</script>

<details
    {open}
    ontoggle={(event) => {
        onToggle?.((event.target as HTMLDetailsElement).open)
    }}
>
    <summary>
        {title}
        <svg class="icon" width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
            <path d="M4 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
    </summary>
    <div class="content">
        {@render children?.()}
    </div>
</details>

<style>
    details {
        width: 100%;
        color: var(--text-color);
    }
    details summary {
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
    }
    details[open] .icon {
        transform: scaleY(-1);
    }
    .content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 10px;
        padding-left: 5px;
    }
</style>
