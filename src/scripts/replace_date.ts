(() => {
    console.log('injected content-script in', window.location.host)
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'

    const originalDate = Date
    const originalDateNow = Date.now

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
    const fakeNow = () => {
        const fakeDate = getFakeDate()
        if (fakeDate !== null) {
            return Date.parse(fakeDate)
        } else {
            return originalDateNow()
        }
    }

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
            Date.now = fakeNow
        } else {
            // eslint-disable-next-line no-global-assign
            Date = originalDate
            Date.now = originalDateNow
        }
    }

    timeTravelCheckToggle()

    window['__timeTravelCheckToggle'] = timeTravelCheckToggle
})()