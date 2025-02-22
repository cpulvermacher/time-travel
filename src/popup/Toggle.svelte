<script lang="ts">
    interface Props {
        label?: string
        description?: string
        checked: boolean
    }
    let { label, description, checked = $bindable() }: Props = $props()
</script>

<label class="toggle">
    <div class="row">
        <div class="label">{label}</div>
        <input type="checkbox" bind:checked />
        <div class="toggle-bg">
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
    }
    .row {
        display: flex;
        gap: 0.5em;
        justify-content: space-between;
        align-items: center;
    }
    .description {
        color: #9f9f9f;
        font-size: 0.9em;
    }

    .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-bg {
        display: block;
        position: relative;
        width: 40px;
        min-width: 40px;
        height: 20px;
        background-color: #eee;
        border-radius: 40px;
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid #9f9f9f;
    }
    input:checked + .toggle-bg {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    input:not(:disabled):hover + .toggle-bg {
        filter: drop-shadow(0 0 1px var(--primary-color));
    }
    input:focus-visible + .toggle-bg {
        outline: 2px solid var(--primary-color);
    }

    .slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background-color: white;
        border-radius: 50%;
        filter: drop-shadow(0 3px 1px rgba(0, 0, 0, 0.3));
        transition: transform 0.3s cubic-bezier(0.65, 0, 0.35, 1);
    }
    input:checked + .toggle-bg .slider {
        transform: translateX(20px);
    }
</style>
