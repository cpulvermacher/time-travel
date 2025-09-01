<script lang="ts">
    import Settings from '../components/Settings.svelte'
    import { m } from '../paraglide/messages'
    import { overwriteGetLocale } from '../paraglide/runtime'
    import { getUILanguage } from '../util/browser'
    import { formatLocalDate } from '../util/date-utils'
    import { getTranslationLocale } from '../util/i18n'
    import { getInitialState } from './initial-state'

    overwriteGetLocale(() => getTranslationLocale(getUILanguage()))

    document.documentElement.lang = getTranslationLocale(getUILanguage())

    const promise = getInitialState()
</script>

{#await promise}
    <div class="loading-container">
        <div class="loading-spinner"></div>
    </div>
{:then initialState}
    <Settings
        fakeDate={initialState.fakeDate ?? formatLocalDate(new Date())}
        isEnabled={!!initialState.isEnabled}
        settings={initialState.settings}
    />
{:catch error}
    <div class="error">
        <p>{error instanceof Error ? error.message : ''}</p>
        <p>{m.permission_error_please_change_tab()}</p>
    </div>
{/await}

<style>
    .error {
        padding: 15px;
    }
    .error > p {
        max-width: 350px;
    }

    .loading-container {
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation:
            spin 1s linear infinite,
            fadeIn 1s ease;
        animation-fill-mode: forwards;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
