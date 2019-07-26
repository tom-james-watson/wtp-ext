import digestUrl from './digest-url'
import {openTorrent} from './torrent'

/**
 * Ensure the browser action badge is showing the right information
 */
export async function ensureBrowserActionBadge(daemon=false) {
  const tab = (await browser.tabs.query({currentWindow: true, active: true}))[0]

  try {
    const {hash, magnetUrl} = digestUrl(tab.url)
    const torrent = await openTorrent(hash, magnetUrl)

    if (torrent) {
      browser.browserAction.setBadgeText({
        text: String(torrent.numPeers),
        tabId: tab.id
      })
      browser.browserAction.setBadgeBackgroundColor({
        color: torrent.numPeers > 0 ? "green" : "red",
        tabId: tab.id
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

browser.tabs.onUpdated.addListener(ensureBrowserActionBadge)
browser.tabs.onActivated.addListener(ensureBrowserActionBadge)

ensureBrowserActionBadge(true)
