<script lang="ts">
    import { untrack } from 'svelte';
    import { m } from '../paraglide/messages';
    import type { InitialState } from '../popup/initial-state';
    import { reloadTab, withTabLoadingRetry } from '../util/browser';
    import { disableFakeDate, setClockState, setFakeDate } from '../util/content-script-state';
    import { formatLocalDate, parseDate } from '../util/date-utils';
    import { updateExtensionIcon } from '../util/icon';
    import { saveMostRecentTimezone, saveSetting } from '../util/settings';
    import DateTimePicker from './DateTimePicker.svelte';
    import DateTimePreview from './DateTimePreview.svelte';
    import ErrorModal from './ErrorModal.svelte';
    import ReloadModal from './ReloadModal.svelte';
    import TimezoneSelect from './TimezoneSelect.svelte';
    import Toggle from './Toggle.svelte';

    interface Props {
        initialState: InitialState;
    }
    const props: Props = $props();
    const initialState = untrack(() => props.initialState);

    let errorMsg = $state<string>();
    let showReloadModal = $state(false);
    let settings = $state(initialState.settings);
    let isEnabled = $state(initialState.isEnabled);
    let fakeDate = $state(initialState.fakeDate);
    let parsedDate = $derived(parseDate(fakeDate));
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined);
    //TODO this should use the tab state, not settings
    let effectiveTimezone = $state(initialState.isEnabled ? settings.timezone : '');

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
        void saveSetting('timezone', settings.timezone);
        void saveMostRecentTimezone(settings.timezone);

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

        effectiveDate = date;
        effectiveTimezone = settings.timezone;
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
        effectiveDate = undefined;
        effectiveTimezone = '';
    }
    function setError(msg: string, err: unknown) {
        errorMsg = msg + (err instanceof Error ? err.message : '');
    }

    function onApply() {
        if (parsedDate.isReset) {
            isEnabled = false;
            void reset();
            fakeDate = formatLocalDate(new Date());
        } else if (parsedDate.isValid) {
            isEnabled = true;
            void applyAndEnable(parsedDate.date);
        }
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
    }
    function onEnableToggle(enabled: boolean) {
        if (enabled && parsedDate.isValid) {
            void applyAndEnable(parsedDate.date);
        } else {
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
        return parsedDate.date.getTime() !== effectiveDate?.getTime() || settings.timezone !== effectiveTimezone;
    }
    function getApplyButtonLabel(): string {
        if (parsedDate.isReset) {
            if (isEnabled) {
                return m.change_date_btn_reset();
            } else {
                return m.change_date_btn_no_changes();
            }
        }
        if (!parsedDate.isValid) {
            return m.change_date_btn_invalid();
        }
        const dateChanged = parsedDate.date.getTime() !== effectiveDate?.getTime();
        const tzChanged = settings.timezone !== effectiveTimezone;
        const fakeDateLabel = formatLocalDate(parsedDate.date);
        const timezoneLabel = settings.timezone || m.timezone_browser_default();
        if (dateChanged && tzChanged) {
            return m.change_date_btn_date_and_tz({
                fakeDate: fakeDateLabel,
                timezone: timezoneLabel,
            });
        }
        if (tzChanged) {
            return m.change_date_btn_tz({ timezone: timezoneLabel });
        }
        if (dateChanged) {
            return m.change_date_btn({ fakeDate: fakeDateLabel });
        }
        return m.change_date_btn_no_changes();
    }
</script>

<main>
    <Toggle
        bind:checked={isEnabled}
        disabled={!parsedDate.isValid && !isEnabled}
        onChange={onEnableToggle}
        label={m.enable_fake_date_toggle()}
    />
    <hr />
    <DateTimePreview date={effectiveDate} timezone={effectiveTimezone} />
    <DateTimePicker bind:fakeDate onEnterKey={onApply} />
    <TimezoneSelect value={settings.timezone} onSelect={onTimezoneChange} recentTimezones={settings.recentTimezones} />
    <div class="right-aligned">
        <button type="button" class="primary apply-button" disabled={!isApplyButtonEnabled()} onclick={onApply}>
            {getApplyButtonLabel()}
        </button>
    </div>
    <hr />
    <Toggle
        bind:checked={settings.stopClock}
        disabled={!parsedDate.isValid}
        onChange={onClockToggle}
        label={m.stop_time_toggle()}
    />
    <Toggle bind:checked={settings.autoReload} onChange={onAutoReloadToggle} label={m.enable_auto_reload()} />
</main>

{#if showReloadModal}
    <ReloadModal />
{/if}
{#if errorMsg}
    <ErrorModal text={errorMsg} />
{/if}

<style>
    .right-aligned {
        display: flex;
        justify-content: flex-end;
    }

    .apply-button {
        width: 100%;
    }

    @media (min-width: 400px) {
        .apply-button {
            width: auto;
        }
    }

    hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 0 calc(-1 * var(--main-padding));
    }
</style>
