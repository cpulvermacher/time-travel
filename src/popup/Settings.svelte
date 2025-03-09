<script lang="ts">
    import { parseDate } from '../util/common'
    import Background from './Background.svelte'
    import DateFormatInfo from './DateFormatInfo.svelte'
    import Datepicker from './Datepicker.svelte'
    import ErrorModal from './ErrorModal.svelte'
    import { setClockState, setFakeDate } from './extension_state'
    import LinkButton from './LinkButton.svelte'
    import ReloadModal from './ReloadModal.svelte'
    import Toggle from './Toggle.svelte'

    interface Props {
        isEnabled: boolean
        fakeDate: string
        isClockStopped: boolean
    }
    const initialState: Props = $props()

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let isClockStopped = $state(initialState.isClockStopped)
    let fakeDate = $state(initialState.fakeDate)
    let isEnabled = $state(initialState.isEnabled)
    let isDateValid = $derived(parseDate(fakeDate) !== null)
    let effectiveDate = $state(initialState.isEnabled ? new Date(initialState.fakeDate) : undefined)
    let showFormatHelp = $state(false)

    async function updateClockState() {
        try {
            await setClockState(isClockStopped)
        } catch (e) {
            errorMsg = 'Toggling clock failed: ' + (e instanceof Error ? e.message : '')
        }
    }
    async function applyAndEnable() {
        try {
            await setClockState(isClockStopped)
            const needReload = await setFakeDate(fakeDate)
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
            await setClockState(true)
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
            Date and time to set <LinkButton onClick={() => (showFormatHelp = true)}>(?)</LinkButton>:
            <Datepicker bind:fakeDate onEnterKey={onApply} />
        </label>
    </div>
    <div class="row right-aligned">
        <button disabled={!isDateValid || new Date(fakeDate).getTime() === effectiveDate?.getTime()} onclick={onApply}>
            Change Date
        </button>
    </div>
    <hr />
    <Toggle bind:checked={isClockStopped} disabled={!isDateValid} onChange={onClockToggle} label="Stop Clock" />
    <Toggle bind:checked={isEnabled} disabled={!isDateValid} onChange={onEnableChange} label="Enable Fake Date" />
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
