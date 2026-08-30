<script lang="ts">
    import { m } from '@/paraglide/messages';
    import Modal from './Modal.svelte';

    interface Props {
        onClose: () => void;
    }
    const { onClose }: Props = $props();

    // the arrow glyphs are the same on every keyboard, so only the named keys are translated
    const shortcuts = [
        { amount: m.date_input_help_shortcut_minute(), keys: ['↑', '↓'] },
        { amount: m.date_input_help_shortcut_10minutes(), modifier: m.key_shift(), keys: ['↑', '↓'] },
        { amount: m.date_input_help_shortcut_hour(), modifier: m.key_ctrl_cmd(), keys: ['↑', '↓'] },
        { amount: m.date_input_help_shortcut_second(), modifier: m.key_alt(), keys: ['↑', '↓'] },
        { amount: m.date_input_help_shortcut_day(), keys: [m.key_page_up(), m.key_page_down()] },
    ];
</script>

<Modal {onClose} closeOnCancel={true}>
    <section>
        <h3>{m.date_input_help_shortcuts()}</h3>
        <table class="shortcuts">
            <tbody>
                {#each shortcuts as shortcut (shortcut.amount)}
                    <tr>
                        <th scope="row">{shortcut.amount}</th>
                        <td>
                            <span class="keys">
                                {#if shortcut.modifier}
                                    <kbd>{shortcut.modifier}</kbd>
                                    <span class="separator">+</span>
                                {/if}
                                {#each shortcut.keys as key, index (key)}
                                    {#if index > 0}
                                        <span class="separator">/</span>
                                    {/if}
                                    <kbd>{key}</kbd>
                                {/each}
                            </span>
                        </td>
                    </tr>
                {/each}
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
    .shortcuts td {
        /* the caps carry their own height, so keep the rows from touching */
        padding: 2px 0;
    }
    .keys {
        display: inline-flex;
        align-items: center;
        gap: var(--gap-small);
    }
    kbd {
        min-width: 1em;
        padding: 1px var(--gap-small);
        background: var(--disabled-background-color);
        border: 1px solid var(--divider-color);
        /* the thicker bottom edge reads as the side of a physical key */
        border-bottom-width: 2px;
        border-radius: var(--input-radius);
        font-family: inherit;
        font-size: 0.95em;
        line-height: 1.4;
        text-align: center;
        white-space: nowrap;
    }
    /* "+" joins keys that are pressed together, "/" separates alternatives */
    .separator {
        color: var(--secondary-text-color);
    }
</style>
