<script lang="ts">
    import Settings from '../components/Settings.svelte'
    import { overwriteGetLocale } from '../paraglide/runtime'
    import { getUILanguage } from '../util/browser'
    import { formatLocalTime } from '../util/common'
    import { getTranslationLocale } from '../util/i18n'
    import { getState } from './extension_state'

    overwriteGetLocale(() => getTranslationLocale(getUILanguage()))

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
