<script lang="ts">
    import { m } from '../paraglide/messages'
    import { reloadTab } from '../util/browser'
    import { parseDate } from '../util/common'
    import { setClockState, setFakeDate } from '../util/content-script-state'
    import { updateExtensionIcon } from '../util/icon'
    import { saveMostRecentTimezone, saveSetting, type Settings } from '../util/settings'
    import Accordion from './Accordion.svelte'
    import Background from './Background.svelte'
    import DateFormatInfo from './DateFormatInfo.svelte'
    import Datepicker from './Datepicker.svelte'
    import ErrorModal from './ErrorModal.svelte'
    import LinkButton from './LinkButton.svelte'
    import ReloadModal from './ReloadModal.svelte'
    import TimezoneSelect from './TimezoneSelect.svelte'
    import Toggle from './Toggle.svelte'

    interface Props {
        isEnabled: boolean
        fakeDate: string
        settings: Settings
    }
    const initialState: Props = $props()

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let settings = $state(initialState.settings)
    let fakeDate = $state(initialState.fakeDate)
    let isEnabled = $state(initialState.isEnabled)
    let isDateValid = $derived(parseDate(fakeDate) !== null)
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined)
    let showFormatHelp = $state(false)

    async function updateClockState() {
        try {
            await setClockState(settings.stopClock)
            await updateExtensionIcon()
            // Note: no need to reload the tab here, stop/resume applies immediately
        } catch (e) {
            setError(m.error_toggle_clock_failed(), e)
        }
    }
    async function applyAndEnable() {
        try {
            await setClockState(settings.stopClock)
            const needReload = await setFakeDate(fakeDate, settings.timezone)
            if (needReload && !settings.autoReload) {
                showReloadModal = true
            }
            await updateExtensionIcon()
            if (settings.autoReload) {
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
            if (settings.autoReload) {
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
    function onAdvancedSettingsToggle(open: boolean) {
        saveSetting('advancedSettingsOpen', open)
    }
    function onClockToggle() {
        if (isEnabled) {
            updateClockState()
        }
        saveSetting('stopClock', settings.stopClock)
    }
    function onAutoReloadToggle() {
        saveSetting('autoReload', settings.autoReload)
    }
    function onTimezoneChange(timezone: string) {
        settings.timezone = timezone
        saveSetting('timezone', timezone)
        saveMostRecentTimezone(timezone)

        if (isEnabled) {
            applyAndEnable()
        }
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
            <Datepicker bind:fakeDate onEnterKey={onApply} timezone={settings.timezone} />
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
    <Accordion title={m.advanced_settings()} open={settings.advancedSettingsOpen} onToggle={onAdvancedSettingsToggle}>
        <Toggle
            bind:checked={settings.stopClock}
            disabled={!isDateValid}
            onChange={onClockToggle}
            label={m.stop_time_toggle()}
        />
        <Toggle bind:checked={settings.autoReload} onChange={onAutoReloadToggle} label={m.enable_auto_reload()} />
        <TimezoneSelect
            value={settings.timezone}
            onSelect={onTimezoneChange}
            recentTimezones={settings.recentTimezones}
        />
    </Accordion>
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
</style>
