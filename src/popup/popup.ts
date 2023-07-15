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

async function setFakeDate(fakeDate: string) {
    if (fakeDate && isNaN(Date.parse(fakeDate))) {
        setError('Invalid format! Try "2023-03-25 12:40", "2023-03-25T12:40Z" (UTC) or "2023-03-25" (midnight).')
        return
    }

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

}

/** toggles clock ticking state, returns true iff the clock was started */
async function toggleTick() {
    const tabId = await getActiveTabId()
    const state = await getContentScriptState(tabId)

    if (state.clockIsRunning) {
        await resetTickStartDate(null)
    } else {
        await resetTickStartDate(new Date())
    }
    return !state.clockIsRunning
}

async function resetTickStartDate(date: Date | null) {
    const tabId = await getActiveTabId()

    if (date === null) {
        await injectFunction(tabId, inject.setTickStartDate, [''])
    } else {
        const nowTimestampStr = date.getTime().toString()
        await injectFunction(tabId, inject.setTickStartDate, [nowTimestampStr])
    }
}

async function updateTickToggleButtonState(clockIsRunning: boolean) {
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
    const state = await getContentScriptState(tabId)
    if (state.fakeDate) {
        const fakeDate = new Date(Date.parse(state.fakeDate))
        if (state.fakeDateActive && state.clockIsRunning && state.tickStartDate) {
            const tickStartDate = Number.parseInt(state.tickStartDate)
            const elapsed = Date.now() - tickStartDate
            const fakeDateNow = new Date(fakeDate.getTime() + elapsed)
            input.setAttribute('value', toLocalTime(fakeDateNow))

        } else {
            input.setAttribute('value', toLocalTime(fakeDate))
        }
    }

    const host = await injectFunction(tabId, getTargetHost, [''])
    const targetHint = document.getElementById('targetHost')
    if (host && targetHint) {
        targetHint.innerText = host
    }

    updateTickToggleButtonState(state.clockIsRunning)
}).catch((error) => {
    setError('Time Travel cannot be used. ' + error)
    input.disabled = true
    tickToggleButton.disabled = true
    resetButton.disabled = true
    setButton.disabled = true
})

// ==================== set up event handlers ====================
input.onkeydown = async (event) => {
    if (event.key == 'Enter') {
        event.preventDefault()

        setButton.click()
    }
}

tickToggleButton.onclick = async () => {
    try {
        const isTicking = await toggleTick()
        await updateTickToggleButtonState(isTicking)
        await setFakeDate(input.value)
    } catch (e) {
        setError('Couldn\'t toggle clock: ' + e)
        await updateTickToggleButtonState(false)
    }
}

resetButton.onclick = async () => {
    try {
        await setFakeDate('')
        await resetTickStartDate(null)
    } catch (e) {
        setError('Couldn\'t reset: ' + e)
    }
}

setButton.onclick = async () => {
    try {
        const tabId = await getActiveTabId()
        const state = await getContentScriptState(tabId)
        if (state.tickStartDate) {
            // we want to start from the new faked date, without any offset
            await resetTickStartDate(new Date())
        }

        await setFakeDate(input.value)
    } catch (e) {
        setError('Couldn\'t set date: ' + e)
    }
}