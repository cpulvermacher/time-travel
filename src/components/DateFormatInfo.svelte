<script lang="ts">
    import { m } from '../paraglide/messages'
    import Modal from './Modal.svelte'

    interface Props {
        onClose: () => void
    }
    const { onClose }: Props = $props()
</script>

<Modal {onClose} closeOnCancel={true}>
    <p>
        {@html m.dateformat_info()}
    </p>
    <ul>
        <li>2025-02-27 12:40</li>
        <li>27 Feb 2025 12:40</li>
        <li>2025-03-30 00:59:55</li>
        <li>2025-04-27T12:40Z</li>
        <li>2025-02-25T12:40:00.120</li>
        <li>1731493140025</li>
    </ul>
</Modal>

<style>
    p,
    ul {
        width: 100%;
    }
    li {
        list-style: none;
        margin: 0;
        margin-inline-start: 20px;
    }
</style>
