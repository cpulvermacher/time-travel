import { expect, test } from './fixtures';

/** the date entered in every locale, and its localized renderings */
const enteredDate = '2025-04-27 12:40';

/**
 * The UI language follows the browser language (see getUILanguage()), which Playwright sets with
 * the `locale` option. */
const languages = [
    {
        name: 'German',
        locale: 'de-DE',
        // Monday first, like fr-FR but unlike en-US and ja-JP
        weekdays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        pageTime: '27. Apr. 2025 12:40:00',
        applyButton: 'Ändern zu 27. Apr. 2025 12:40',
    },
    {
        name: 'French',
        locale: 'fr-FR',
        weekdays: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
        pageTime: '27 avr. 2025 12:40:00',
        applyButton: 'Changer la date à 27 avr. 2025 12:40',
    },
    {
        name: 'Japanese',
        locale: 'ja-JP',
        // Sunday first, and a date format that puts the year first
        weekdays: ['日', '月', '火', '水', '木', '金', '土'],
        pageTime: '2025年4月27日 12:40:00',
        applyButton: '日時を2025年4月27日 12:40に変更',
    },
];

for (const { name, locale, weekdays, pageTime, applyButton } of languages) {
    test.describe(name, () => {
        test.use({ locale });

        test('starts the calendar week on the first day of the locale', async ({ popup }) => {
            await expect(popup.calendarWeekdays).toHaveText(weekdays);
        });

        test('formats the date and time for the locale', async ({ popup }) => {
            await popup.setDate(enteredDate);
            await expect(popup.applyButton).toHaveText(applyButton);

            await popup.applyButton.click();

            await expect(popup.pageTime).toHaveText(pageTime);
        });
    });
}
