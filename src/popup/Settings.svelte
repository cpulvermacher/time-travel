<script lang="ts">
    import { parseDate } from '../util/common'
    import Background from './Background.svelte'
    import Datepicker from './Datepicker.svelte'
    import ErrorModal from './ErrorModal.svelte'
    import { setAndEnable, setClockState, setFakeDate } from './extension_state'
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

    async function updateClockState() {
        try {
            await setClockState(clockIsRunning)
        } catch (e) {
            errorMsg = 'Toggling clock failed: ' + (e instanceof Error ? e.message : '')
        }
    }
    async function applyAndEnable() {
        try {
            await setClockState(clockIsRunning)
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
            await setClockState(false)
        } catch (e) {
            errorMsg = 'Reset failed: ' + (e instanceof Error ? e.message : '')
        }
    }
    function onApply() {
        isEnabled = true
        effectiveDate = new Date(fakeDate)
        applyAndEnable()
    }
    function onClockToggle() {
        if (isEnabled) {
            updateClockState()
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
            <Datepicker bind:fakeDate onEnterKey={onApply} />
        </label>
    </div>
    <div class="row right-aligned">
        <button disabled={!isDateValid || new Date(fakeDate).getTime() === effectiveDate?.getTime()} onclick={onApply}>
            Change Date
        </button>
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
    .row.right-aligned {
        justify-content: flex-end;
    }

    hr {
        width: 90%;
        border: none;
        border-top: 1px solid var(--border-color);
    }
</style>
