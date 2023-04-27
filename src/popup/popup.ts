import { injectFunction, reloadTab, setBadgeText, setTitle } from '../util/browser'

const defaultTitleText = 'Time Travel'

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
}

function isContentScriptInjected() {
    return !!((window as { __timeTravelInjected?: boolean }).__timeTravelInjected)
}

function getTargetHost() {
    return window.location.host
}

/** registers content script, returns true if reload is needed*/
async function registerContentScriptIfNeeded() {
    const isScriptInjected = await injectFunction(isContentScriptInjected, [''])
    console.log('script detcted:', isScriptInjected)
    if (isScriptInjected)
        return false

    const CONTENT_SCRIPT: chrome.scripting.RegisteredContentScript = {
        'id': 'replaceDate',
        'js': [
            'scripts/replace_date.js'
        ],
        'matches': [
            '<all_urls>'
        ],
        'runAt': 'document_start',
        'world': 'MAIN',
        'allFrames': true
    }
    const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [CONTENT_SCRIPT.id] })
    if (scripts.length > 0) {
        await chrome.scripting.updateContentScripts([CONTENT_SCRIPT])
    } else {
        await chrome.scripting.registerContentScripts([CONTENT_SCRIPT])
    }

    return true
}

function showReloadModal() {
    const reloadButton = document.getElementById('reloadBtn') as HTMLButtonElement
    reloadButton.onclick = async () => {
        await reloadTab()
        window.close()
    }

    const modal = document.getElementById('reloadModal')
    modal?.classList.remove('modal--hidden')
    modal?.classList.add('modal--ripple')
}

async function onFakeDate(fakeDate: string) {
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        setError('Invalid format! Try "2023-03-25 12:40", "2023-03-25T12:40Z" (UTC) or "2023-03-25" (midnight).')
        return
    }

    try {
        let needsReload = false
        if (fakeDate) {
            needsReload = await registerContentScriptIfNeeded()
        }

        await injectFunction(setFakeDate, [fakeDate])
        await setBadgeText(fakeDate ? 'ON' : '')
        await setTitle(defaultTitleText + (fakeDate ? ` (${fakeDate})` : ' (Off)'))

        if (needsReload) {
            showReloadModal()
        } else {
            window.close()
        }

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
}).catch(() => { /* ignore */ })

injectFunction(getTargetHost, ['']).then((host) => {
    const targetHint = document.getElementById('targetHost')
    if (host && targetHint) {
        targetHint.innerText = host
    }
}).catch(() => { /* ignore */ })


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