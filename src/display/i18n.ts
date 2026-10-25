import { type Locale, locales } from '@/paraglide/runtime';

/** languages using Traditional Chinese script (lowercase), which we serve with zh-TW */
const traditionalChinesePrefixes = ['zh-tw', 'zh-hk', 'zh-mo', 'zh-hant'];

/**
 * for a language string like 'en' or 'de-AT', return available locale.
 * defaults to 'en' if not available.
 */
export function getTranslationLocale(uiLanguage: string): Locale {
    // language tags are case-insensitive, and some sources use underscores like the _locales/ dirs
    const normalized = uiLanguage.replaceAll('_', '-').toLowerCase();
    if (traditionalChinesePrefixes.some((prefix) => normalized.startsWith(prefix))) {
        return 'zh-TW';
    }
    // any other Chinese (zh, zh-CN, zh-SG, zh-Hans) uses Simplified script
    if (normalized === 'zh' || normalized.startsWith('zh-')) {
        return 'zh-CN';
    }
    for (const locale of locales) {
        if (normalized.startsWith(locale.toLowerCase())) {
            return locale;
        }
    }
    return 'en';
}

/** get the first day of the week (1=Monday, 7: Sunday) */
export function getFirstDayOfWeek(uiLanguage: string): number {
    const normalized = uiLanguage.replaceAll('_', '-').toLowerCase();
    /* v8 ignore start -- environment-dependent: `getWeekInfo` exists on newer runtimes
        (Chrome 130+, Node 24+) but not on older ones, so exactly one of the two paths below
        is reachable per environment. Excluded so coverage stays stable across Node versions. */
    // Chrome supports `getWeekInfo()` since version 130
    const locale = new Intl.Locale(normalized);
    if ('getWeekInfo' in locale) {
        interface WeekInfo {
            firstDay: number;
        }
        const info = (locale.getWeekInfo as () => WeekInfo)();
        return info.firstDay;
    }

    // for browsers without support, add some common Monday cases and assume Sunday for the rest
    // when adding language support, add appropriate regions here as well
    if (
        normalized.startsWith('ca') ||
        normalized.startsWith('cs') ||
        normalized.startsWith('da') ||
        normalized.startsWith('de') ||
        normalized === 'en-gb' ||
        normalized.startsWith('es') ||
        normalized.startsWith('fr') ||
        normalized.startsWith('it') ||
        normalized.startsWith('nl') ||
        normalized.startsWith('pl') ||
        normalized.startsWith('ru') ||
        normalized.startsWith('sv') ||
        normalized.startsWith('tr') ||
        normalized.startsWith('uk') ||
        normalized.startsWith('vi') ||
        normalized === 'zh' ||
        normalized === 'zh-cn' ||
        normalized === 'zh-hans' ||
        normalized === 'zh-hans-cn'
    ) {
        return 1;
    }

    return 7;
    /* v8 ignore stop */
}
