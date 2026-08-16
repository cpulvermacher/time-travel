import { expect, type Locator, type Page } from '@playwright/test';

// localStorage key of the mocked tab state (see src/util/content-script-state.ts)
const devTabStateKey = 'timeTravelDevTabState';
// what the mocked reloadTab() logs instead of reloading (see src/util/browser.ts)
const mockTabReloadLog = 'reloading tab (mocked)';

/** A Toggle or Checkbox component; both wrap a checkbox input in a label of the same name. */
class CheckControl {
    readonly checkbox: Locator;
    private readonly label: Locator;

    constructor(page: Page, component: 'toggle' | 'checkbox', label: string) {
        this.label = page.locator(`label.${component}`).filter({ hasText: label });
        this.checkbox = this.label.getByRole('checkbox');
    }

    async click() {
        await this.label.click();
    }

    /** click the toggle unless it is already in the wanted state */
    async set(checked: boolean) {
        if ((await this.checkbox.isChecked()) !== checked) {
            await this.click();
        }
    }
}

/** The extension popup as served by the Vite dev server, where the extension APIs are mocked and
 * the tab state lives in localStorage. */
export class Popup {
    readonly dateInput: Locator;
    readonly dateInputLabel: Locator;
    readonly applyButton: Locator;
    readonly pageTime: Locator;
    readonly pageTimeOffset: Locator;
    readonly pageTimeSeasonStep: Locator;
    readonly realTimeNote: Locator;
    readonly timezoneSelect: Locator;
    readonly calendar: Locator;
    readonly calendarWeekdays: Locator;
    readonly reloadModal: Locator;
    readonly reloadButton: Locator;
    readonly fakeDateToggle: CheckControl;
    readonly stopClockToggle: CheckControl;
    readonly autoReloadToggle: CheckControl;
    readonly timezoneCheckbox: CheckControl;
    readonly timeInput: Locator;
    private reloadedTabs = 0;

    /** `mobile` renders the Android UI, see the `mobile` fixture option */
    constructor(
        readonly page: Page,
        private readonly mobile = false
    ) {
        page.on('console', (message) => {
            if (message.text().includes(mockTabReloadLog)) {
                this.reloadedTabs++;
            }
        });

        this.dateInput = page.locator('.input-fields input[type="text"]');
        this.timeInput = page.locator('.input-fields input[type="time"]'); // mobile only
        this.dateInputLabel = page.locator('.label-row label');
        this.applyButton = page.locator('button.apply-button');
        this.pageTime = page.locator('.page-time .datetime');
        this.pageTimeOffset = page.locator('.page-time .badge');
        this.pageTimeSeasonStep = page.locator('.page-time .badge .season-step');
        this.realTimeNote = page.locator('.page-time .note');
        this.timezoneSelect = page.getByRole('combobox');
        this.calendar = page.locator('.datepicker');
        this.calendarWeekdays = this.calendar.locator('.dow');
        this.reloadModal = page.getByRole('dialog').filter({ hasText: 'reload the page' });
        this.reloadButton = this.reloadModal.getByRole('button', { name: 'Reload' });
        this.fakeDateToggle = new CheckControl(page, 'toggle', 'Fake JavaScript date');
        this.stopClockToggle = new CheckControl(page, 'toggle', 'Stop clock');
        this.autoReloadToggle = new CheckControl(page, 'toggle', 'Reload page on changes');
        this.timezoneCheckbox = new CheckControl(page, 'checkbox', 'Change time zone');
    }

    /** open the popup */
    async open() {
        await this.page.goto(this.mobile ? '/popup/main.html?mobile' : '/popup/main.html');
        await expect(this.dateInput).toBeVisible();
    }

    /** close and open the popup again, keeping the mocked tab state and settings */
    async reopen() {
        await this.page.reload();
        await expect(this.dateInput).toBeVisible();
    }

    async setDate(date: string) {
        await this.dateInput.fill(date);
    }

    /** Move the system time forward, which a running page clock follows.
     *
     * The tests run on a fake clock (see the `systemTime` fixture option), so time only passes
     * here, and it passes instantly. */
    async advanceClock(milliseconds: number) {
        await this.page.clock.runFor(milliseconds);
    }

    /** the option of a time zone in the time zone dropdown */
    timezoneOption(timezone: string): Locator {
        return this.timezoneSelect.locator(`option[value="${timezone}"]`);
    }

    /** the button of a day in the month the calendar currently shows */
    calendarDay(day: number): Locator {
        return this.calendar.getByRole('button', { name: String(day), exact: true });
    }

    /** the day the calendar currently highlights as selected */
    selectedCalendarDay(): Locator {
        return this.calendar.locator('.date.range.start.end');
    }

    /** the part of the date input that is currently selected */
    selectedDateInputText(): Promise<string> {
        return this.dateInput.evaluate((input: HTMLInputElement) =>
            input.value.substring(input.selectionStart ?? 0, input.selectionEnd ?? 0)
        );
    }

    /** enter a date and apply it by pressing Enter */
    async applyWithEnter(date: string) {
        await this.setDate(date);
        await this.dateInput.press('Enter');
    }

    /** enter a date and apply it by clicking the apply button */
    async applyWithButton(date: string) {
        await this.setDate(date);
        await this.applyButton.click();
    }

    /** number of tab reloads the popup requested since it was created */
    tabReloads(): number {
        return this.reloadedTabs;
    }

    /** pretend the content script is already injected in the tab, i.e. the extension was used
     * before, so applying a date does not ask for a reload */
    async markContentScriptActive() {
        // runs on every navigation, so the rest of the tab state (e.g. the applied date) is kept
        await this.page.addInitScript((key) => {
            const state = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
            localStorage.setItem(key, JSON.stringify({ ...state, contentScriptActive: true }));
        }, devTabStateKey);
    }
}
