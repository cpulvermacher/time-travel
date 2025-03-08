<script lang="ts">
    import Modal from './Modal.svelte'

    interface Props {
        onClose: () => void
    }
    const { onClose }: Props = $props()
</script>

<Modal {onClose} closeOnCancel={true}>
    Supported formats:
    <dl>
        <dt>2023-04-27 12:40</dt>
        <dd>Local time</dd>
        <dt>2023-04-27</dt>
        <dd>Midnight UTC</dd>
        <dt>2025-03-30 00:59:55</dt>
        <dd>5 seconds before a one-hour jump to 2 a.m. (summer time) in Europe/London</dd>
        <dt>2023-04-27T12:40Z</dt>
        <dd>Set local equivalent for given UTC time</dd>
        <dt>2023-03-25T12:40:00.120</dt>
        <dd>Local time with milliseconds</dd>
        <dt>1731493140025</dt>
        <dd>UNIX timestamp</dd>
    </dl>
</Modal>

<style>
    dl {
        margin: 0;
        padding: 0;
    }
    dt {
        font-weight: bold;
        margin: 0;
        margin-inline-start: 0;
    }
    dd {
        padding: 0;
        margin: 0;
        margin-inline-start: 10px;
    }
</style>
