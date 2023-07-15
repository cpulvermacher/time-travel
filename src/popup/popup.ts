import { getActiveTabId, injectFunction, reloadTab } from '../util/browser'
import { getContentScriptState, setBadgeAndTitle } from '../util/common'
import * as inject from '../util/inject'

function toLocalTime(date: Date): string {
    // returns date in format "YYYY-MM-DD hh:mm" in local time
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 16).replace('T', ' ')
}

function setError(message: string) {
    const errorMsg = document.getElementById('errormsg')
    if (!errorMsg)
        return

    errorMsg.innerText = message
    errorMsg.className = message ? 'error--visible' : 'error--hidden'
}

function getTargetHost() {
    return window.location.host
}

/** registers content script, returns true if reload is needed*/
async function registerContentScriptIfNeeded(tabId: number) {
    const isScriptInjected = await injectFunction(tabId, inject.isContentScriptInjected, [''])
    console.log('script detected:', isScriptInjected)
    if (isScriptInjected)
        return false

    const contentScripts: chrome.scripting.RegisteredContentScript[] = [{
        'id': 'replaceDate',
        'js': [
            'scripts/replace_date.js'
        ],
        'matches': [
            '<all_urls>'
        ],
        'runAt': 'document_start',
        'world': 'MAIN',
        'allFrames': true,
        'persistAcrossSessions': false,
    }, {
        'id': 'sendActive',
        'js': [
            'scripts/send_active.js'
        ],
        'matches': [
            '<all_urls>'
        ],
        'runAt': 'document_start',
        'world': 'ISOLATED',
        'allFrames': true,
        'persistAcrossSessions': false,
    }]
    const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: contentScripts.map(script => script.id) })
    if (scripts.length > 0) {
        await chrome.scripting.updateContentScripts(contentScripts)
    } else {
        await chrome.scripting.registerContentScripts(contentScripts)
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
    const modalBackground = document.getElementById('modalBackground')
    modalBackground?.classList.add('modal-background--visible')
    reloadButton.focus()

}

async function onFakeDate(fakeDate: string) {
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        setError('Invalid format! Try "2023-03-25 12:40", "2023-03-25T12:40Z" (UTC) or "2023-03-25" (midnight).')
        return
    }

    try {
        const tabId = await getActiveTabId()

        let needsReload = false
        if (fakeDate) {
            needsReload = await registerContentScriptIfNeeded(tabId)
        }

        await injectFunction(tabId, inject.setFakeDate, [fakeDate])

        const state = await getContentScriptState(tabId)
        await setBadgeAndTitle(tabId, state)

        if (needsReload) {
            showReloadModal()
        } else {
            window.close()
        }

    } catch (e) {
        setError('Couldn\'t set date: ' + e)
    }
}

async function onToggleTick() {
    try {
        const tabId = await getActiveTabId()
        const nowTimestampStr = (new Date()).getTime().toString()
        await injectFunction(tabId, inject.toggleTick, [nowTimestampStr])
    } catch (e) {
        setError('Couldn\'t toggle clock: ' + e)
    }
}

async function getTickState() {
    try {
        const tabId = await getActiveTabId()
        return !!await injectFunction(tabId, inject.isClockTicking, [''])
    } catch (e) {
        return false
    }
}


async function updateTickToggleButtonState() {
    const clockIsRunning = await getTickState()
    const toggleBtn = document.getElementsByClassName('tick-state')[0]
    if (clockIsRunning)
        toggleBtn.classList.remove('tick-state--stopped')
    else
        toggleBtn.classList.add('tick-state--stopped')
}


// ==================== initialize popup state ====================
const input = document.getElementById('fakeDateInput') as HTMLInputElement
const resetButton = document.getElementById('resetBtn') as HTMLButtonElement
const setButton = document.getElementById('setBtn') as HTMLButtonElement
const tickToggleButton = document.getElementById('tickToggleBtn') as HTMLButtonElement

input.setAttribute('value', toLocalTime(new Date()))
input.focus()
input.setSelectionRange(-1, -1)

getActiveTabId().then(async (tabId) => {
    const fakeDateFromStorage = await injectFunction(tabId, inject.getFakeDate, [''])
    if (fakeDateFromStorage) {
        const fakeDate = new Date(Date.parse(fakeDateFromStorage))
        input.setAttribute('value', toLocalTime(fakeDate))

    }

    const host = await injectFunction(tabId, getTargetHost, [''])
    const targetHint = document.getElementById('targetHost')
    if (host && targetHint) {
        targetHint.innerText = host
    }

    updateTickToggleButtonState()
})

// ==================== set up event handlers ====================
input.onkeydown = async (event) => {
    if (event.key == 'Enter') {
        event.preventDefault()

        const fakeDate = input.value
        await onFakeDate(fakeDate)
    }
}

//TODO also tick time in popup
tickToggleButton.onclick = async () => {
    await onToggleTick()
    await updateTickToggleButtonState()
    await onFakeDate(input.value)
}

resetButton.onclick = async () => {
    await onFakeDate('')
}

setButton.onclick = async () => {
    await onFakeDate(input.value)
}