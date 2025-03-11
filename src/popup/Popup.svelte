<script lang="ts">
    import Settings from '../components/Settings.svelte'
    import { formatLocalTime } from '../util/common'
    import { getState } from './extension_state'

    const promise = getState()
</script>

{#await promise then initialState}
    <Settings
        fakeDate={initialState.fakeDate ?? formatLocalTime(new Date())}
        isEnabled={!!initialState.fakeDate}
        isClockStopped={initialState.isClockStopped}
    />
{:catch error}
    <p>{error instanceof Error ? error.message : 'Could not get initial state'}</p>
    <p>Please switch to a different tab to change the time.</p>
{/await}
