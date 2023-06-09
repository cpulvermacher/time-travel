(() => {
    console.log('injected content-script in', window.location.host)
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'

    const originalDate = Date

    // Date constructor, needs to be a function to allow both constructing (`new Date()`) and calling without new: `Date()`
    function FakeDate(
        this: Date | void,
        yearOrObject?: number | string | Date,
        monthIndex?: number,
        date?: number,
        hours?: number,
        minutes?: number,
        seconds?: number,
        ms?: number
    ) {
        if (!(this instanceof Date)) { //invoked without 'new'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (new (FakeDate as any)()).toString()
        }

        if (yearOrObject === undefined) {
            const fakeDate = getFakeDate()
            if (fakeDate !== null) {
                return new originalDate(fakeDate)
            } else {
                return new originalDate()
            }
        } else if (monthIndex === undefined) {
            return new originalDate(yearOrObject)
        } else if (date === undefined) {
            return new originalDate(yearOrObject as number, monthIndex)
        } else if (hours === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date)
        } else if (minutes === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours)
        } else if (seconds === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes)
        } else if (ms === undefined) {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes, seconds)
        } else {
            return new originalDate(yearOrObject as number, monthIndex, date, hours, minutes, seconds, ms)
        }
    }

    // needed for now()
    const fakeNow = () => {
        return (new Date()).getTime()
    }

    FakeDate.prototype = Date.prototype
    FakeDate.parse = Date.parse
    FakeDate.UTC = Date.UTC
    FakeDate.now = fakeNow

    function getFakeDate(): string | null {
        try {
            return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
        } catch (err) {
            //in sandbox, we might not be able to access sessionStorage
            return null
        }
    }

    const timeTravelCheckToggle = () => {
        // FakeDate does not support all of Date's features right now, replace only when we already have a fake date set
        // this seems better than breaking random web pages
        const fakeDateActive = getFakeDate() != null
        console.log('toggle fake date', fakeDateActive, window.location.host)
        if (fakeDateActive) {
            // eslint-disable-next-line no-global-assign
            Date = FakeDate as DateConstructor
        } else {
            // eslint-disable-next-line no-global-assign
            Date = originalDate
        }
    }

    timeTravelCheckToggle()

    window['__timeTravelCheckToggle'] = timeTravelCheckToggle
})()