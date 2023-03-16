// eslint-disable-next-line no-global-assign
Date = class extends Date {
    constructor(...options) {
        if (options.length) {
            super(...options);
        } else if (window.TT_FAKE_DATE !== undefined) {
            super(window.TT_FAKE_DATE);
        } else {
            super();
        }
    }
};