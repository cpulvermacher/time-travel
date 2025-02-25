<script lang="ts">
    import { parseDate } from '../util/common'
    import Background from './Background.svelte'
    import Datepicker from './Datepicker.svelte'
    import ErrorModal from './ErrorModal.svelte'
    import { resetTickStart, setAndEnable, setFakeDate, toggleTick } from './helpers'
    import ReloadModal from './ReloadModal.svelte'
    import Toggle from './Toggle.svelte'

    interface Props {
        isEnabled: boolean
        fakeDate: string
        clockIsRunning: boolean
    }
    const initialState: Props = $props()

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let clockIsRunning = $state(initialState.clockIsRunning)
    let fakeDate = $state(initialState.fakeDate)
    let isEnabled = $state(initialState.isEnabled)
    let isDateValid = $derived(parseDate(fakeDate) !== null)
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined)

    async function toggleClockRunning() {
        try {
            await toggleTick()
            await setFakeDate(fakeDate)
        } catch (e) {
            errorMsg = 'Toggling clock failed: ' + (e instanceof Error ? e.message : '')
        }
    }
    async function applyAndEnable() {
        try {
            //TODO missing clock state
            const needReload = await setAndEnable(fakeDate)
            if (needReload) {
                showReloadModal = true
            }
        } catch (e) {
            errorMsg = 'Could not set date: ' + (e instanceof Error ? e.message : '')
        }
    }
    async function reset() {
        try {
            await setFakeDate('')
            await resetTickStart(null)
        } catch (e) {
            errorMsg = 'Reset failed: ' + (e instanceof Error ? e.message : '')
        }
    }
    function onEnterKey() {
        isEnabled = true
        effectiveDate = new Date(fakeDate)
        applyAndEnable()
    }
    function onClockToggle() {
        if (isEnabled) {
            toggleClockRunning()
        }
    }
    function onEnableChange(enabled: boolean) {
        if (enabled) {
            effectiveDate = new Date(fakeDate)
            applyAndEnable()
        } else {
            effectiveDate = undefined
            reset()
        }
    }
</script>

<Background {effectiveDate} />
<main>
    <div class="row">
        <label>
            Date and time to set:
            <Datepicker bind:fakeDate {onEnterKey} />
        </label>
    </div>
    <hr />
    <Toggle
        bind:checked={clockIsRunning}
        disabled={!isDateValid}
        onChange={onClockToggle}
        label="Progress time"
        description="Clock will progress from fake time"
    />
    <Toggle bind:checked={isEnabled} disabled={!isDateValid} onChange={onEnableChange} label="Enable Fake Date" />
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
    }

    .row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-end;
    }

    hr {
        width: 90%;
        border: none;
        border-top: 1px solid var(--border-color);
    }
</style>
