<script lang="ts">
    interface Props {
        message?: string
    }
    const { message }: Props = $props()
</script>

<p class="error {message ? 'visible' : ''}">{message}</p>

<style>
    .error.visible {
        padding: 5px;
        color: var(--error-color);
        border: 1px solid var(--error-color);
    }
</style>
