/// <reference types="../global"/>


// needed for constructor
class FakeDate extends Date {
    constructor(...options: []) {
        if (options.length) {
            super(...options)
        } else if (window.TT_FAKE_DATE !== undefined) {
            super(window.TT_FAKE_DATE)
        } else {
            super()
        }
    }
}

// eslint-disable-next-line no-global-assign
Date = FakeDate as DateConstructor

// needed for now()
const originalDateNow = Date.now
Date.now = () => {
    if (window.TT_FAKE_DATE !== undefined) {
        return Date.parse(window.TT_FAKE_DATE)
    } else {
        return originalDateNow()
    }
}