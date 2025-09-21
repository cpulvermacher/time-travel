<script lang="ts">
    import { m } from '../paraglide/messages';
    import { reloadTab, withTabLoadingRetry } from '../util/browser';
    import { disableFakeDate, setClockState, setFakeDate } from '../util/content-script-state';
    import { parseDate } from '../util/date-utils';
    import { updateExtensionIcon } from '../util/icon';
    import { saveMostRecentTimezone, saveSetting, type Settings } from '../util/settings';
    import Accordion from './Accordion.svelte';
    import Background from './Background.svelte';
    import Datepicker from './Datepicker.svelte';
    import ErrorModal from './ErrorModal.svelte';
    import ReloadModal from './ReloadModal.svelte';
    import TimezoneSelect from './TimezoneSelect.svelte';
    import Toggle from './Toggle.svelte';

    interface Props {
        isEnabled: boolean;
        fakeDate: string;
        settings: Settings;
    }
    const initialState: Props = $props();

    let errorMsg = $state<string>();
    let showReloadModal = $state(false);
    let settings = $state(initialState.settings);
    let isEnabled = $state(initialState.isEnabled);
    let fakeDate = $state(initialState.fakeDate);
    let parsedDate = $derived(parseDate(fakeDate));
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined);

    async function updateClockState() {
        try {
            await withTabLoadingRetry(async () => {
                await setClockState(settings.stopClock);
                await updateExtensionIcon();
                // Note: no need to reload the tab here, stop/resume applies immediately
            });
        } catch (e) {
            setError(m.error_toggle_clock_failed(), e);
        }
    }
    async function applyAndEnable(date: Date) {
        try {
            await withTabLoadingRetry(async () => {
                await setClockState(settings.stopClock);
                const needReload = await setFakeDate(date, settings.timezone);
                if (needReload && !settings.autoReload) {
                    showReloadModal = true;
                }
                await updateExtensionIcon();
                if (settings.autoReload) {
                    await reloadTab();
                }
            });
        } catch (e) {
            setError(m.error_setting_date_failed(), e);
        }
    }
    async function reset() {
        try {
            await withTabLoadingRetry(async () => {
                await disableFakeDate();
                await setClockState(true);
                await updateExtensionIcon();
                if (settings.autoReload) {
                    await reloadTab();
                }
            });
        } catch (e) {
            setError(m.error_reset_failed(), e);
        }
    }
    function setError(msg: string, err: unknown) {
        errorMsg = msg + (err instanceof Error ? err.message : '');
    }

    function onApply() {
        if (parsedDate.isReset) {
            isEnabled = false;
            effectiveDate = undefined;
            void reset();
        } else if (parsedDate.isValid) {
            isEnabled = true;
            effectiveDate = parsedDate.date;
            void applyAndEnable(effectiveDate);
        }
    }
    function onAdvancedSettingsToggle(open: boolean) {
        void saveSetting('advancedSettingsOpen', open);
    }
    function onClockToggle() {
        if (isEnabled) {
            void updateClockState();
        }
        void saveSetting('stopClock', settings.stopClock);
    }
    function onAutoReloadToggle() {
        void saveSetting('autoReload', settings.autoReload);
    }
    function onTimezoneChange(timezone: string) {
        settings.timezone = timezone;
        void saveSetting('timezone', timezone);
        void saveMostRecentTimezone(timezone);

        if (isEnabled && effectiveDate) {
            void applyAndEnable(effectiveDate);
        }
    }
    function onEnableToggle(enabled: boolean) {
        if (enabled && parsedDate.isValid) {
            effectiveDate = parsedDate.date;
            void applyAndEnable(effectiveDate);
        } else {
            effectiveDate = undefined;
            void reset();
        }
    }
    function isApplyButtonEnabled(): boolean {
        if (!parsedDate.isValid && !parsedDate.isReset) {
            return false;
        }
        if (parsedDate.isReset) {
            return isEnabled;
        }
        return parsedDate.date.getTime() !== effectiveDate?.getTime();
    }
</script>

<Background {effectiveDate} />
<main>
    <Datepicker bind:fakeDate onEnterKey={onApply} timezone={settings.timezone} />
    <div class="right-aligned">
        <button disabled={!isApplyButtonEnabled()} onclick={onApply}>{m.change_date_btn()}</button>
    </div>
    <hr />
    <Toggle
        bind:checked={isEnabled}
        disabled={!parsedDate.isValid && !isEnabled}
        onChange={onEnableToggle}
        label={m.enable_fake_date_toggle()}
    />
    <Accordion title={m.advanced_settings()} open={settings.advancedSettingsOpen} onToggle={onAdvancedSettingsToggle}>
        <Toggle
            bind:checked={settings.stopClock}
            disabled={!parsedDate.isValid}
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

    .right-aligned {
        display: flex;
        justify-content: flex-end;
    }

    hr {
        width: 90%;
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 0 auto;
    }
</style>
