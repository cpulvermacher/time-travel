async function getActiveTabId() {
    let queryOptions = { active: true, currentWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}

//Note: needs 'storage' permission
async function storageGet(key) {
    return (await chrome.storage.local.get([key]))[key];
}

function setFakeDate(date) {
    window.TT_FAKE_DATE = date || undefined;
}

async function injectFakeDate(fakeDate) {
    console.log('injecting fake date', fakeDate)
    const tabId = await getActiveTabId();

    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: setFakeDate,
        args: [fakeDate],
        world: 'MAIN'
    });
}

async function onFakeDate(fakeDate) {
    await injectFakeDate(fakeDate);
    await chrome.storage.local.set({ fakeDate });

    //TODO error handling (we might not get a tab)
    await chrome.action.setBadgeText({
        tabId: await getActiveTabId(),
        text: fakeDate ? 'ON' : ''
    });
    window.close();
}

const input = document.getElementById('fakeDateInput');

const fakeDateFromStorage = await storageGet('fakeDate')
const initialValue = fakeDateFromStorage || (new Date()).toISOString();
input.setAttribute('value', initialValue);


document.getElementById('setBtn').onclick = async () => {
    const fakeDate = input.value;
    //TODO validate
    await onFakeDate(fakeDate)
};

input.onkeydown = async (event) => {
    if (event.key == 'Enter') {
        event.preventDefault();

        const fakeDate = input.value;
        //TODO validate
        await onFakeDate(fakeDate)
    }
};

document.getElementById('resetBtn').onclick = async () => {
    await onFakeDate('')
}