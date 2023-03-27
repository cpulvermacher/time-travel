function getFakeDate(): string | null {
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    try {
        return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
    } catch (err) {
        //in sandbox, we might not be able to access sessionStorage
        return null
    }
}

// needed for constructor
class FakeDate extends Date {
    constructor(...options: []) {
        if (options.length) {
            super(...options)
        } else {
            const fakeDate = getFakeDate()
            if (fakeDate !== null) {
                super(fakeDate)
            } else {
                super()
            }
        }
    }
}

// needed for now()
const originalDateNow = Date.now
const fakeNow = () => {
    const fakeDate = getFakeDate()
    if (fakeDate !== null) {
        return Date.parse(fakeDate)
    } else {
        return originalDateNow()
    }
}

// FakeDate does not support all of Date's features right now, replace only when we already have a fake date set
// this means on you need to reload the page at least once after setting a date, but it's better than breaking
// random web pages
if (getFakeDate() != null) {
    // eslint-disable-next-line no-global-assign
    Date = FakeDate as DateConstructor
    Date.now = fakeNow
}