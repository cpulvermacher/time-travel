/// <reference types="../global"/>

class MyDate extends Date {
    constructor() {
        if (window.TT_FAKE_DATE !== undefined) {
            super(window.TT_FAKE_DATE)
        } else {
            super()
        }
    }
}

Date = MyDate as DateConstructor