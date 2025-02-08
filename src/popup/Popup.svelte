<script lang="ts">
    import { formatLocalTime } from '../util/common'
    import { getInitialState, resetTickStart, setAndEnable, setFakeDate, toggleTick } from './helpers'
    import Message from './Message.svelte'
    import ReloadModal from './ReloadModal.svelte'

    let errorMsg = $state<string>()
    let showReloadModal = $state(false)
    let disabled = $state(false)
    let clockIsRunning = $state(false)
    let fakeDate = $state('')

    getInitialState()
        .then((result) => {
            clockIsRunning = result.clockIsRunning
            fakeDate = result.fakeDate ?? formatLocalTime(new Date())
        })
        .catch((error) => {
            errorMsg = error instanceof Error ? error.message : 'Could not get initial state'
            disabled = true
        })

    function onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault()
            changeDate()
        }
    }
    function focus(node: HTMLInputElement) {
        node.focus()
        node.setSelectionRange(-1, -1)
    }
    async function toggleClockRunning() {
        try {
            clockIsRunning = await toggleTick()
            await setFakeDate(fakeDate)
        } catch (e) {
            errorMsg = 'Toggling clock failed: ' + (e instanceof Error ? e.message : '')
            clockIsRunning = false
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
</script>

<main>
    <div class="row">
        <label>
            Date and time to set:
            <input
                {disabled}
                {onkeydown}
                bind:value={fakeDate}
                use:focus
                type="text"
                size="28"
                maxlength="28"
                spellcheck="false"
            />
        </label>
        <button
            {disabled}
            onclick={toggleClockRunning}
            class="tick-toggle-btn"
            title="Start/stop progressing clock from given value"
            aria-label="Start/stop progressing clock from given value"
        >
            <span class="tick-state {clockIsRunning ? '' : 'stopped'}"></span>
        </button>
    </div>
    <Message message={errorMsg} />
    <div class="row">
        <button {disabled} onclick={reset} title="Stop faking time and reset">Reset</button>
        <button {disabled} onclick={changeDate} class="primary" title="Change time to the value entered"
            >Change Date</button
        >
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

    .tick-state.stopped::before {
        content: '\23F5';
    }
    .tick-state:not(.stopped)::before {
        content: '\23F9';
    }
</style>
