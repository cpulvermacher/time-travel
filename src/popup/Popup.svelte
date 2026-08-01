<script lang="ts">
    import { getTranslationLocale } from '@/display/i18n';
    import { getUILanguage } from '@/web-ext/browser';
    import Settings from '../components/Settings.svelte';
    import { m } from '../paraglide/messages';
    import { overwriteGetLocale } from '../paraglide/runtime';
    import { getInitialState } from './initial-state';

    const locale = getTranslationLocale(getUILanguage());
    overwriteGetLocale(() => locale);
    document.documentElement.lang = locale;

    const promise = getInitialState();
</script>

{#if import.meta.env.DEV}
    <span class="mock-badge">[mock]</span>
{/if}

{#await promise}
    <main></main>
{:then initialState}
    <Settings {initialState} />
{:catch error}
    <div class="error">
        <p>{error instanceof Error ? error.message : ""}</p>
        <p>{m.permission_error_please_change_tab()}</p>
    </div>
{/await}

<style>
    .mock-badge {
        position: fixed;
        right: 4px;
        bottom: 2px;
        pointer-events: none;
        color: #c026d3;
        font-weight: bold;
        font-size: 0.75rem;
    }

    .error {
        padding: 15px;
    }
    .error > p {
        max-width: 350px;
    }
</style>
