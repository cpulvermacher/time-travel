import { getActiveTabId, injectFunction, isFileUrl, registerContentScript, reloadTab } from '../util/browser'
import { formatLocalTime, getContentScriptState, isContentScriptActive, setBadgeAndTitle } from '../util/common'
import * as inject from '../util/inject'


function setError(message: string) {
    const errorMsg = document.getElementById('errormsg')
    if (!errorMsg)
        return

    errorMsg.innerText = message
    errorMsg.className = message ? 'error--visible' : 'error--hidden'
}

function disableUi() {
    input.disabled = true
    tickToggleButton.disabled = true
    resetButton.disabled = true
    setButton.disabled = true
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
    if (fakeDate && !await isContentScriptActive(tabId)) {
        await registerContentScript()
        needsReload = true
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
        await resetTickStart(null)
    } else {
        await resetTickStart(new Date())
    }
    return !state.clockIsRunning
}

async function resetTickStart(date: Date | null) {
    const tabId = await getActiveTabId()

    if (date === null) {
        await injectFunction(tabId, inject.setTickStartTimestamp, [''])
    } else {
        const nowTimestampStr = date.getTime().toString()
        await injectFunction(tabId, inject.setTickStartTimestamp, [nowTimestampStr])
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

input.setAttribute('value', formatLocalTime(new Date()))
input.focus()
input.setSelectionRange(-1, -1)

getActiveTabId().then(async (tabId) => {
    try {
        const state = await getContentScriptState(tabId)
        if (state.fakeDate) {
            const fakeDate = new Date(Date.parse(state.fakeDate))
            if (state.fakeDateActive && state.clockIsRunning && state.tickStartTimestamp) {
                const tickStartTimestamp = Number.parseInt(state.tickStartTimestamp)
                const elapsed = Date.now() - tickStartTimestamp
                const fakeDateNow = new Date(fakeDate.getTime() + elapsed)
                input.setAttribute('value', formatLocalTime(fakeDateNow))

            } else {
                input.setAttribute('value', formatLocalTime(fakeDate))
            }
        }

        updateTickToggleButtonState(state.clockIsRunning)
    } catch (error) {
        if (await isFileUrl(tabId)) {
            setError('Failed to access page. Please make sure "Allow access to file URLs" is enabled in the extension settings.')
            disableUi()
        } else {
            throw error
        }
    }
}).catch((error) => {
    setError('Time Travel cannot be used. ' + error)
    disableUi()
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
        setError('Toggling clock failed: ' + e)
        await updateTickToggleButtonState(false)
    }
}

resetButton.onclick = async () => {
    try {
        await setFakeDate('')
        await resetTickStart(null)
    } catch (e) {
        setError('Reset failed: ' + e)
    }
}

setButton.onclick = async () => {
    try {
        const tabId = await getActiveTabId()
        const state = await getContentScriptState(tabId)
        if (state.tickStartTimestamp) {
            // we want to start from the new faked date, without any offset
            await resetTickStart(new Date())
        }

        await setFakeDate(input.value)
    } catch (e) {
        setError('Setting date failed: ' + e)
    }
}