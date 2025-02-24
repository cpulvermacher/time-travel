<script lang="ts">
    import Datepicker from './Datepicker.svelte'
    import { resetTickStart, setAndEnable, setFakeDate, toggleTick } from './helpers'
    import Message from './Message.svelte'
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
    function onClockToggle() {
        if (isEnabled) {
            toggleClockRunning()
        }
    }
    function onEnableChange(enabled: boolean) {
        if (enabled) {
            applyAndEnable()
        } else {
            reset()
        }
    }
</script>

<main>
    <div class="row">
        <label>
            Date and time to set:
            <Datepicker bind:fakeDate onEnterKey={applyAndEnable} />
        </label>
    </div>
    <Message message={errorMsg} />
    <Toggle
        bind:checked={clockIsRunning}
        onChange={onClockToggle}
        label="Progress time"
        description="Clock will progress from fake time"
    />
    <Toggle bind:checked={isEnabled} onChange={onEnableChange} label="Enable Fake Date" />
</main>
<ReloadModal visible={showReloadModal} />

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
</style>
