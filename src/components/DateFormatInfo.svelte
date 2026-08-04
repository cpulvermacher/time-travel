<script lang="ts">
    import { m } from '../paraglide/messages';
    import Modal from './Modal.svelte';

    interface Props {
        onClose: () => void;
    }
    const { onClose }: Props = $props();
</script>

<Modal {onClose} closeOnCancel={true}>
    <section>
        <h3>{m.dateformat_info_keys()}</h3>
        <ul>
            <li>{m.dateformat_info_keys_minute()}</li>
            <li>{m.dateformat_info_keys_10minutes()}</li>
            <li>{m.dateformat_info_keys_hour()}</li>
            <li>{m.dateformat_info_keys_second()}</li>
            <li>{m.dateformat_info_keys_day()}</li>
        </ul>
    </section>
    <section>
        <h3>{m.dateformat_info_heading()}</h3>
        <p>{@html m.dateformat_info()}</p>
        <dl>
            <dt>
                {m.dateformat_info_local()}
                <span class="note">({m.dateformat_info_local_note()})</span>
            </dt>
            <dd>2025-02-27 12:40</dd>
            <dd>27 Feb 2025 12:40</dd>
            <dd>2025-03-30 00:59:55</dd>
            <dd>2025-02-25T12:40:00.120</dd>

            <dt>{m.dateformat_info_utc()}</dt>
            <dd>2025-04-27T12:40Z</dd>
            <dd>1731493140025</dd>

            <dt>
                {m.dateformat_info_offset()}
                <span class="note">({m.dateformat_info_offset_note()})</span>
            </dt>
            <dd>2025-04-27T12:40+02:00</dd>
        </dl>
    </section>
</Modal>

<style>
    section {
        width: 100%;
    }
    h3 {
        margin: 0 0 5px;
        font-size: 1em;
    }
    p {
        margin-bottom: 8px;
    }
    dt {
        margin-top: 8px;
    }
    dt:first-child {
        margin-top: 0;
    }
    .note {
        color: var(--secondary-text-color);
    }
    dd,
    li {
        list-style: none;
        margin: 0;
        margin-inline-start: 20px;
    }
</style>
