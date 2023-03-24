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

// eslint-disable-next-line no-global-assign
Date = FakeDate as DateConstructor

// needed for now()
const originalDateNow = Date.now
Date.now = () => {
    const fakeDate = getFakeDate()
    if (fakeDate !== null) {
        return Date.parse(fakeDate)
    } else {
        return originalDateNow()
    }
}