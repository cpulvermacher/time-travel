import { injectFunction, setBadgeText } from '../util/browser'

function truncateDateForInput(date: Date): string {
    // truncate seconds, add Z for UTC
    return date.toISOString().slice(0, 16) + 'Z'
}

function setError(message: string) {
    const errorMsg = document.getElementById('errormsg')
    if (!errorMsg)
        return

    errorMsg.innerText = message
    errorMsg.className = message ? 'error--visible' : 'error--hidden'
}

function getFakeDate() {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
}

function setFakeDate(date: string) {
    //needs to be defined locally!
    const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
    if (date)
        window.sessionStorage.setItem(FAKE_DATE_STORAGE_KEY, date)
    else
        window.sessionStorage.removeItem(FAKE_DATE_STORAGE_KEY)

    const event = new Event('timeTravelToggled')
    document.dispatchEvent(event)
}

async function onFakeDate(fakeDate: string) {
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        setError('Invalid format! Try "2023-03-25 12:40", "2023-03-25T12:40Z" (UTC) or "2023-03-25" (midnight).')
        return
    }

    try {
        await injectFunction(setFakeDate, [fakeDate])
        await setBadgeText(fakeDate ? 'ON' : '')

        window.close()

    } catch (e) {
        setError('Couldn\'t set date: ' + e)
    }
}

// ==================== initialize popup ====================
const input = document.getElementById('fakeDateInput') as HTMLInputElement

input.setAttribute('value', truncateDateForInput(new Date()))

injectFunction(getFakeDate, ['']).then((fakeDateFromStorage) => {
    if (fakeDateFromStorage) {
        const fakeDate = new Date(Date.parse(fakeDateFromStorage))
        input.setAttribute('value', truncateDateForInput(fakeDate))
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