import digestUrl from './digest-url'
import {getTorrent} from './torrent'

/**
 * Ensure the browser action badge is showing the right information
 */
export async function ensureBrowserActionBadge(daemon=false) {
  const tab = (await browser.tabs.query({currentWindow: true, active: true}))[0]

  try {
    const {hash} = await digestUrl(tab.url)
    const torrent = await getTorrent(hash)

    if (torrent && !torrent.loading) {
      browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: String(torrent.numPeers)
      })
      browser.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: torrent.numPeers > 0 ? "green" : "red"
      })
    } else {
      browser.browserAction.setBadgeText({
        tabId: tab.id,
        text: null
      })
      browser.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: null
      })
    }
  } catch (err) {
    if (err.message !== 'Not a WTP URL') {
      throw err
    }
  }

  if (daemon) {
    setTimeout(() => {
      ensureBrowserActionBadge(true)
    }, 5000)
  }
}

browser.tabs.onUpdated.addListener(() => {
  ensureBrowserActionBadge()
})
browser.tabs.onActivated.addListener(() => {
  ensureBrowserActionBadge()
})

ensureBrowserActionBadge(true)
