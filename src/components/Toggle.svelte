<script lang="ts">
    interface Props {
        label?: string;
        description?: string;
        checked: boolean;
        disabled?: boolean;
        bold?: boolean;
        light?: boolean;
        onChange?: (checked: boolean) => void;
    }
    let { label, description, checked = $bindable(), disabled, bold, light, onChange }: Props = $props();

    function onchange() {
        onChange?.(checked);
    }
</script>

<label class="toggle">
    <div class="row">
        <div class={["label", { disabled, bold, light }]}>{label}</div>
        <input type="checkbox" bind:checked {onchange} {disabled} />
        <div class={["toggle-bg", { light }]}>
            <span class="slider"></span>
        </div>
    </div>
    <div class="description">{description}</div>
</label>

<style>
    .toggle {
        display: flex;
        flex-direction: column;
        user-select: none;
        cursor: pointer;
    }
    .row {
        display: flex;
        gap: var(--gap-small);
        justify-content: space-between;
        align-items: center;
    }
    .label {
        transition: color var(--short-duration) var(--ease-out);
    }
    .label.disabled {
        color: var(--secondary-text-color);
    }
    .label.bold {
        font-weight: bold;
    }
    .label.light {
        color: white;
    }
    .description {
        color: var(--secondary-text-color);
        font-size: 0.9rem;
    }

    .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-bg {
        display: block;
        position: relative;
        width: 32px;
        min-width: 32px;
        height: 16px;
        background-color: #eee;
        border-radius: 32px;
        transition:
            background-color var(--short-duration) var(--ease-out),
            border-color var(--short-duration) var(--ease-out),
            box-shadow var(--short-duration) var(--ease-out);
        border: 1px solid var(--border-color);
    }
    input:not(:disabled):checked + .toggle-bg {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    .row:hover input:not(:disabled) + .toggle-bg {
        box-shadow: var(--ring);
        border-color: var(--border-hover-color);
    }
    .row:hover input:not(:disabled):checked + .toggle-bg {
        border-color: var(--primary-color);
    }
    input:focus-visible + .toggle-bg {
        outline: var(--focus-outline);
        outline-offset: var(--focus-outline-offset);
    }
    input:disabled + .toggle-bg {
        /* lighter than an enabled track, so a disabled toggle reads as inactive */
        border-color: var(--divider-color);
    }
    .toggle-bg.light {
        background-color: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    .slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 12px;
        height: 12px;
        background-color: white;
        border-radius: 50%;
        filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.3));
        transition:
            transform var(--short-duration) var(--ease-out),
            background-color var(--short-duration) var(--ease-out);
    }
    input:checked + .toggle-bg .slider {
        transform: translateX(16px);
    }
    input:disabled + .toggle-bg .slider {
        background-color: #eee;
    }

    input:not(:disabled):checked + .toggle-bg.light {
        background-color: white;
        border-color: white;
    }
    input:not(:disabled):checked + .toggle-bg.light .slider {
        background-color: var(--primary-color);
    }
</style>
