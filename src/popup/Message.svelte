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
        color: #893b3b;
        border: 1px solid #893b3b;
    }
</style>
