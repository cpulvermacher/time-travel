async function getActiveTabId() {
    const queryOptions = { active: true, currentWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    return tab.id
}

//Note: needs 'storage' permission
async function storageGet(key: string) {
    return (await chrome.storage.local.get([key]))[key]
}

function setError(message: string) {
    const errorMsg = document.getElementById('errormsg')
    if (!errorMsg)
        return

    errorMsg.innerText = message
    errorMsg.className = message ? 'error--visible' : 'error--hidden'
}

function setFakeDate(date: string) {
    window.TT_FAKE_DATE = date || undefined
}

async function injectFakeDate(fakeDate: string) {
    console.log('injecting fake date', fakeDate)
    const tabId = await getActiveTabId()
    if (tabId == undefined)
        throw new Error("Couldn't get active tab")

    // this fails (not surprisingly)
    await chrome.scripting.executeScript({
        target: { tabId },
        func: setFakeDate,
        args: [fakeDate],
        world: 'MAIN'
    })
}

async function onFakeDate(fakeDate: string) {
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        setError('Invalid format! Try "2023-03-25 12:40", "2023-03-25T12:40Z" (UTC) or "2023-03-25" (midnight).')
        return
    }

    try {
        await injectFakeDate(fakeDate)

        await chrome.storage.local.set({ fakeDate })

        await chrome.action.setBadgeText({
            tabId: await getActiveTabId(),
            text: fakeDate ? 'ON' : ''
        })

        window.close()

    } catch (e) {
        setError('Couldn\'t set date: ' + e)
    }
}

const input = document.getElementById('fakeDateInput') as HTMLInputElement

input.setAttribute('value', (new Date()).toISOString())
storageGet('fakeDate').then((fakeDateFromStorage) => {
    if (fakeDateFromStorage) {
        input.setAttribute('value', fakeDateFromStorage)
    }
})


document.getElementById('setBtn')!.onclick = async () => {
    const fakeDate = input.value
    await onFakeDate(fakeDate)
}

input.onkeydown = async (event) => {
    if (event.key == 'Enter') {
        event.preventDefault()

        const fakeDate = input.value
        await onFakeDate(fakeDate)
    }
}

document.getElementById('resetBtn')!.onclick = async () => {
    await onFakeDate('')
}