<script lang="ts">
    interface Props {
        label?: string;
        description?: string;
        checked: boolean;
        disabled?: boolean;
        onChange?: (checked: boolean) => void;
    }
    let { label, description, checked = $bindable(), disabled, onChange }: Props = $props();

    function onchange() {
        onChange?.(checked);
    }
</script>

<label class="checkbox">
    <div class="row">
        <input type="checkbox" bind:checked {onchange} {disabled} />
        <div class="box">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
            </svg>
        </div>
        <div class={["label", { disabled }]}>{label}</div>
    </div>
    <div class="description">{description}</div>
</label>

<style>
    .checkbox {
        display: flex;
        min-height: 1.2lh;
        flex-direction: column;
        user-select: none;
        cursor: pointer;
    }
    .row {
        display: flex;
        position: relative;
        gap: var(--checkbox-gap);
        align-items: center;
    }
    .label {
        transition: color var(--short-duration) var(--ease-out);
    }
    .label.disabled {
        color: var(--secondary-text-color);
    }
    .description {
        color: var(--secondary-text-color);
        font-size: 0.9rem;
        padding-left: var(--checkbox-label-offset);
    }

    .checkbox input {
        /* out of the flow, so it does not count as a flex item and add a gap before the box */
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }

    .box {
        display: flex;
        position: relative;
        /* border-box, so the size token is the outer size the label offset is derived from */
        box-sizing: border-box;
        width: var(--checkbox-size);
        min-width: var(--checkbox-size);
        height: var(--checkbox-size);
        align-items: center;
        justify-content: center;
        background-color: white;
        border: 1px solid var(--border-color);
        border-radius: var(--input-radius);
        transition:
            background-color var(--short-duration) var(--ease-out),
            border-color var(--short-duration) var(--ease-out),
            box-shadow var(--short-duration) var(--ease-out);
    }
    input:not(:disabled):checked + .box {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    .row:hover input:not(:disabled) + .box {
        box-shadow: var(--ring);
        border-color: var(--border-hover-color);
    }
    .row:hover input:not(:disabled):checked + .box {
        border-color: var(--primary-color);
    }
    input:focus-visible + .box {
        outline: var(--focus-outline);
        outline-offset: var(--focus-outline-offset);
    }
    input:disabled + .box {
        /* lighter than an enabled box, so a disabled checkbox reads as inactive */
        border-color: var(--divider-color);
    }
    input:disabled:checked + .box {
        background-color: var(--divider-color);
    }

    svg {
        width: 100%;
        height: 100%;
        fill: none;
        stroke: white;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
</style>
