import { getActiveTabId, injectFunction, reloadTab, setBadgeText, setTitle } from '../util/browser'
import { defaultTitleText, getFakeDate, isContentScriptInjected, setFakeDate } from '../util/common'

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
async function registerContentScriptIfNeeded(tabId: number | undefined) {
    const isScriptInjected = await injectFunction(tabId, isContentScriptInjected, [''])
    console.log('script detcted:', isScriptInjected)
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

        await injectFunction(tabId, setFakeDate, [fakeDate])
        await setBadgeText(tabId, fakeDate ? 'ON' : '')
        await setTitle(tabId, defaultTitleText + (fakeDate ? ` (${fakeDate})` : ' (Off)'))

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

input.setAttribute('value', toLocalTime(new Date()))

getActiveTabId().then((tabId) => {
    injectFunction(tabId, getFakeDate, ['']).then((fakeDateFromStorage) => {
        if (fakeDateFromStorage) {
            const fakeDate = new Date(Date.parse(fakeDateFromStorage))
            input.setAttribute('value', toLocalTime(fakeDate))
        }
    }).catch(() => { /* ignore */ })

    injectFunction(tabId, getTargetHost, ['']).then((host) => {
        const targetHint = document.getElementById('targetHost')
        if (host && targetHint) {
            targetHint.innerText = host
        }
    }).catch(() => { /* ignore */ })
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