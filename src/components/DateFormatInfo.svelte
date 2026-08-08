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
        <table class="shortcuts">
            <tbody>
                <tr>
                    <th scope="row">{m.dateformat_info_keys_minute()}</th>
                    <td>{m.dateformat_info_keys_minute_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.dateformat_info_keys_10minutes()}</th>
                    <td>{m.dateformat_info_keys_10minutes_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.dateformat_info_keys_hour()}</th>
                    <td>{m.dateformat_info_keys_hour_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.dateformat_info_keys_second()}</th>
                    <td>{m.dateformat_info_keys_second_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.dateformat_info_keys_day()}</th>
                    <td>{m.dateformat_info_keys_day_keys()}</td>
                </tr>
            </tbody>
        </table>
    </section>
    <section>
        <h3>{m.dateformat_info_heading()}</h3>
        <dl>
            <dt>{m.dateformat_info_local()}</dt>
            <dd class="note">{m.dateformat_info_local_note()}</dd>
            <dd>2025-02-27 12:40</dd>
            <dd>27 Feb 2025 12:40</dd>
            <dd>2025-03-30 00:59:55</dd>
            <dd>2025-02-25T12:40:00.120</dd>

            <dt>{m.dateformat_info_utc()}</dt>
            <dd>2025-04-27T12:40Z</dd>
            <dd>1731493140025</dd>

            <dt>{m.dateformat_info_offset()}</dt>
            <dd class="note">{m.dateformat_info_offset_note()}</dd>
            <dd>2025-04-27T12:40+02:00</dd>
        </dl>
    </section>
</Modal>

<style>
    section {
        width: 100%;
    }
    h3 {
        margin: 0 0 var(--gap-small);
        font-size: 1.1em;
    }
    dt {
        margin-top: var(--gap-mid);
        font-weight: 600;
    }
    dt:first-child {
        margin-top: 0;
    }
    .note {
        color: var(--secondary-text-color);
        font-size: 0.9em;
        margin-bottom: var(--gap-small);
    }
    dd {
        margin: 0;
    }
    .shortcuts {
        border-collapse: collapse;
    }
    .shortcuts th {
        /* the amount is a row header, but should not stand out from the keys next to it */
        font-weight: 400;
        text-align: start;
        padding: 0 15px 0 0;
        white-space: nowrap;
    }
</style>
