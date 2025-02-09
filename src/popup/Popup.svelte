<script lang="ts">
    import { formatLocalTime } from '../util/common'
    import { getInitialState } from './helpers'
    import Settings from './Settings.svelte'

    const promise = getInitialState()
</script>

{#await promise then initialState}
    <Settings
        fakeDate={initialState.fakeDate ?? formatLocalTime(new Date())}
        clockIsRunning={initialState.clockIsRunning}
    />
{:catch error}
    <p>{error instanceof Error ? error.message : 'Could not get initial state'}</p>
    <p>Please switch to a different tab to change the time.</p>
{/await}
