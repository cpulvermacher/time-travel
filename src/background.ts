chrome.runtime.onInstalled.addListener(async () => {
  chrome.action.setBadgeBackgroundColor({ color: '#6060f4' })
})


function getFakeDate() {
  const FAKE_DATE_STORAGE_KEY = 'timeTravelDate'
  return window.sessionStorage.getItem(FAKE_DATE_STORAGE_KEY)
}

async function injectFunction<Args extends [string], Result>(
  tabId: number,
  func: (...args: Args) => Result,
  args: Args
): Promise<NonNullable<chrome.scripting.Awaited<Result>> | null> {

  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args,
    world: 'MAIN',
    injectImmediately: true,
  })

  for (const value of result) {
    if (value.result)
      return value.result
  }
  return null

}
async function setBadgeText(tabId, text: string) {
  await chrome.action.setBadgeText({
    tabId,
    text
  })
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId
  try {
    const fakeDate = await injectFunction(tabId, getFakeDate, [''])
    await setBadgeText(tabId, fakeDate ? 'ON' : '')
  } catch {
    //ignore errors
  }
})

//requires 'webNavigation' permission
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.url.startsWith('chrome://'))
    return
  const tabId = details.tabId
  try {
    const fakeDate = await injectFunction(tabId, getFakeDate, [''])
    await setBadgeText(tabId, fakeDate ? 'ON' : '')
  } catch {
    //ignore errors
  }
})