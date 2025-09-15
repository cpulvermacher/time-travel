import { locales, type Locale } from '../paraglide/runtime';

/**
 * for a language string like 'en' or 'de-AT', return available locale.
 * defaults to 'en' if not available.
 */
export function getTranslationLocale(language: string): Locale {
    for (const locale of locales) {
        if (language.startsWith(locale)) {
            return locale;
        }
    }
    return 'en';
}

/** get the first day of the week (1=Monday, 7: Sunday) */
export function getFirstDayOfWeek(lang: string): number {
    // Chrome supports `getWeekInfo()` since version 130
    const locale = new Intl.Locale(lang);
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
        lang.startsWith('ca') ||
        lang.startsWith('cs') ||
        lang.startsWith('da') ||
        lang.startsWith('de') ||
        lang === 'en-GB' ||
        lang.startsWith('es') ||
        lang.startsWith('fr') ||
        lang.startsWith('it') ||
        lang.startsWith('nl') ||
        lang.startsWith('pl') ||
        lang.startsWith('ru') ||
        lang.startsWith('sv') ||
        lang.startsWith('tr') ||
        lang.startsWith('uk') ||
        lang.startsWith('vi') ||
        lang === 'zh' ||
        lang === 'zh-CN'
    ) {
        return 1;
    }

    return 7;
}
