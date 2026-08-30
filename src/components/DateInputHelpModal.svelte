<script lang="ts">
    import { m } from '@/paraglide/messages';
    import Modal from './Modal.svelte';

    interface Props {
        onClose: () => void;
    }
    const { onClose }: Props = $props();
</script>

<Modal {onClose} closeOnCancel={true}>
    <section>
        <h3>{m.date_input_help_shortcuts()}</h3>
        <table class="shortcuts">
            <tbody>
                <tr>
                    <th scope="row">{m.date_input_help_shortcut_minute()}</th>
                    <td>{m.date_input_help_shortcut_minute_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.date_input_help_shortcut_10minutes()}</th>
                    <td>{m.date_input_help_shortcut_10minutes_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.date_input_help_shortcut_hour()}</th>
                    <td>{m.date_input_help_shortcut_hour_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.date_input_help_shortcut_second()}</th>
                    <td>{m.date_input_help_shortcut_second_keys()}</td>
                </tr>
                <tr>
                    <th scope="row">{m.date_input_help_shortcut_day()}</th>
                    <td>{m.date_input_help_shortcut_day_keys()}</td>
                </tr>
            </tbody>
        </table>
    </section>
    <section>
        <h3>{m.date_input_help_formats()}</h3>
        <dl>
            <dt>{m.date_input_help_formats_local()}</dt>
            <dd class="note">{m.date_input_help_formats_local_note()}</dd>
            <dd>2025-02-27 12:40</dd>
            <dd>27 Feb 2025 12:40</dd>
            <dd>2025-03-30 00:59:55</dd>
            <dd>2025-02-25T12:40:00.120</dd>

            <dt>{m.date_input_help_formats_utc()}</dt>
            <dd>2025-04-27T12:40Z</dd>
            <dd>1731493140025</dd>

            <dt>{m.date_input_help_formats_offset()}</dt>
            <dd class="note">{m.date_input_help_formats_offset_note()}</dd>
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
