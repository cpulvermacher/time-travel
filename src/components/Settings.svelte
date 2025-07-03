<script lang="ts">
    import { m } from '../paraglide/messages.js'
    import { setClockState, setFakeDate, updateExtensionIcon } from '../popup/extension_state'
    import { reloadTab, saveSetting } from '../util/browser.js'
    import { parseDate } from '../util/common'
    import Background from './Background.svelte'
    import DateFormatInfo from './DateFormatInfo.svelte'
    import Datepicker from './Datepicker.svelte'
    import ErrorModal from './ErrorModal.svelte'
    import LinkButton from './LinkButton.svelte'
    import ReloadModal from './ReloadModal.svelte'
    import Toggle from './Toggle.svelte'

    interface Props {
        isEnabled: boolean
        fakeDate: string
        isClockStopped: boolean
        autoReload: boolean
    }
    const initialState: Props = $props()

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let isClockStopped = $state(initialState.isClockStopped)
    let autoReload = $state(initialState.autoReload)
    let fakeDate = $state(initialState.fakeDate)
    let isEnabled = $state(initialState.isEnabled)
    let isDateValid = $derived(parseDate(fakeDate) !== null)
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined)
    let showFormatHelp = $state(false)

    async function updateClockState() {
        try {
            await setClockState(isClockStopped)
            await updateExtensionIcon()
            // Note: no need to reload the tab here, stop/resume applies immediately
        } catch (e) {
            setError(m.error_toggle_clock_failed(), e)
        }
    }
    async function applyAndEnable() {
        try {
            await setClockState(isClockStopped)
            const needReload = await setFakeDate(fakeDate)
            if (needReload && !autoReload) {
                showReloadModal = true
            }
            await updateExtensionIcon()
            if (autoReload) {
                await reloadTab()
            }
        } catch (e) {
            setError(m.error_setting_date_failed(), e)
        }
    }
    async function reset() {
        try {
            await setFakeDate('')
            await setClockState(true)
            await updateExtensionIcon()
            if (autoReload) {
                await reloadTab()
            }
        } catch (e) {
            setError(m.error_reset_failed(), e)
        }
    }
    function setError(msg: string, err: unknown) {
        errorMsg = msg + (err instanceof Error ? err.message : '')
    }

    function onApply() {
        const parsedDate = parseDate(fakeDate)
        if (parsedDate === null) {
            return
        }

        if (parsedDate === '') {
            isEnabled = false
            effectiveDate = undefined
            reset()
        } else {
            isEnabled = true
            effectiveDate = new Date(parsedDate)
            applyAndEnable()
        }
    }
    function onClockToggle() {
        if (isEnabled) {
            updateClockState()
        }
    }
    function onAutoReloadToggle(value: boolean) {
        autoReload = value
        saveSetting('autoReload', value)
    }
    function onEnableChange(enabled: boolean) {
        const parsedDate = parseDate(fakeDate)
        if (parsedDate === null) {
            return
        }

        if (enabled) {
            effectiveDate = new Date(parsedDate)
            applyAndEnable()
        } else {
            effectiveDate = undefined
            reset()
        }
    }
    function hasDateChanged(): boolean {
        const newFakeDate = new Date(parseDate(fakeDate) || '')
        return newFakeDate.getTime() !== effectiveDate?.getTime()
    }
</script>

<Background {effectiveDate} />
<main>
    <div class="row">
        <label>
            {m.datetime_input_label()}
            <LinkButton onClick={() => (showFormatHelp = true)}>{m.format_help_link()}</LinkButton>
            {#if import.meta.env.DEV}<span class="mock-active">[mock]</span>{/if}
            <Datepicker bind:fakeDate onEnterKey={onApply} />
        </label>
    </div>
    <div class="row right-aligned">
        <button disabled={!isDateValid || !hasDateChanged()} onclick={onApply}>{m.change_date_btn()}</button>
    </div>
    <hr />
    <Toggle
        bind:checked={isEnabled}
        disabled={!isDateValid}
        onChange={onEnableChange}
        label={m.enable_fake_date_toggle()}
    />
    <details class="advanced-section">
        <summary>
            {m.advanced_settings()}
            <svg class="advanced-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
        </summary>
        <!-- TODO: extract this-->
        <!-- TODO: save open/close state -->
        <div class="advanced-content">
            <Toggle
                bind:checked={isClockStopped}
                disabled={!isDateValid}
                onChange={onClockToggle}
                label={m.stop_time_toggle()}
            />
            <Toggle bind:checked={autoReload} onChange={onAutoReloadToggle} label={m.enable_auto_reload()} />
        </div>
    </details>
</main>

{#if showFormatHelp}
    <DateFormatInfo onClose={() => (showFormatHelp = false)} />
{/if}
{#if showReloadModal}
    <ReloadModal />
{/if}
{#if errorMsg}
    <ErrorModal text={errorMsg} />
{/if}

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 15px;
    }
    .mock-active {
        color: red;
        font-weight: bold;
    }

    .row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-end;
    }
    .row.right-aligned {
        justify-content: flex-end;
    }

    hr {
        width: 90%;
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 0 auto;
    }

    .advanced-section {
        width: 100%;
        color: var(--text-color);
    }
    .advanced-section summary {
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
    }
    .advanced-section[open] .advanced-icon {
        transform: scaleY(-1);
    }
    .advanced-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 10px;
        padding-left: 5px;
    }
</style>
