<script lang="ts">
    import Settings from '../components/Settings.svelte'
    import { m } from '../paraglide/messages'
    import { overwriteGetLocale } from '../paraglide/runtime'
    import { getUILanguage } from '../util/browser'
    import { formatLocalTime } from '../util/common'
    import { getTranslationLocale } from '../util/i18n'
    import { getState } from './extension_state'

    overwriteGetLocale(() => getTranslationLocale(getUILanguage()))

    document.documentElement.lang = getTranslationLocale(getUILanguage())

    const promise = getState()
</script>

{#await promise then initialState}
    <Settings
        fakeDate={initialState.fakeDate ?? formatLocalTime(new Date())}
        isEnabled={!!initialState.fakeDate}
        isClockStopped={initialState.isClockStopped}
        autoReload={initialState.autoReload}
    />
{:catch error}
    <p>{error instanceof Error ? error.message : ''}</p>
    <p>{m.permission_error_please_change_tab()}</p>
{/await}
