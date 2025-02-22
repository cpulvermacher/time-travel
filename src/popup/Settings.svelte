<script lang="ts">
    import Datepicker from './Datepicker.svelte'
    import { resetTickStart, setAndEnable, setFakeDate, toggleTick } from './helpers'
    import Message from './Message.svelte'
    import ReloadModal from './ReloadModal.svelte'
    import Toggle from './Toggle.svelte'

    interface Props {
        fakeDate: string
        clockIsRunning: boolean
    }
    const initialState: Props = $props()

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let clockIsRunning = $state(initialState.clockIsRunning)
    let fakeDate = $state(initialState.fakeDate)

    async function toggleClockRunning() {
        try {
            clockIsRunning = await toggleTick()
            const needReload = await setFakeDate(fakeDate)
            if (needReload) {
                showReloadModal = true
            }
        } catch (e) {
            errorMsg = 'Toggling clock failed: ' + (e instanceof Error ? e.message : '')
            clockIsRunning = false
        }
    }
    async function changeDate() {
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

    const playIcon = '\u23F5'
    const stopIcon = '\u23F9'
</script>

<main>
    <div class="row">
        <label>
            Date and time to set:
            <Datepicker bind:fakeDate onEnterKey={changeDate} />
        </label>
    </div>
    <Toggle bind:checked={clockIsRunning} label="Progress time" description="Clock will progress from fake time" />
    <Message message={errorMsg} />
    <div class="row">
        <button onclick={reset} title="Stop faking time and reset">Reset</button>
        <button onclick={changeDate} class="primary" title="Change time to the value entered">Change Date</button>
    </div>
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
    .primary {
        background: var(--primary-color);
        color: white;
    }

    .tick-toggle-btn {
        min-width: 27px;
        width: 27px;
        position: relative;
    }

    .tick-state {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: x-large;
        line-height: 26px;
    }
</style>
