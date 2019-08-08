import url from 'url'
import localforage from 'localforage'
import {deleteTorrent} from './torrent'

const TORRENT_TTL_MS = 1800000 // 30 minutes

/**
 * Get a set of all open hosts from what tabs are currently open
 *
 * @returns {Set} Open hosts
 */
async function getOpenHosts() {
  return new Promise((resolve) => {
    browser.windows.getAll({populate: true}, (windows) => {
      let openHosts = new Set()

      windows.forEach((window) => {
        window.tabs.forEach((tab) => {
          const tabHost = url.parse(tab.url).host
          openHosts.add(tabHost)
        })
      })

      resolve(openHosts)
    })
  })
}

/**
 * Cleanup task to remove torrents from storage once their TTL ends.
 *
 * Torrents that are not explictly marked to be seeded will be removed from
 * storage after TORRENT_TTL_MS of not having been opened.
 */
async function cacheCleanup() {
  const openHosts = await getOpenHosts()
  const storedTorrents = await localforage.getItem('stored-torrents') || {}
  const now = new Date()

  for (const hash in storedTorrents) {
    if (openHosts.has(storedTorrents[hash].host) || storedTorrents[hash].seed) {
      // Torrent still open or is being seeded
      storedTorrents[hash].lastOpen = now.toISOString()
      continue
    }

    const sinceLastOpen = now - new Date(storedTorrents[hash].lastOpen)

    if (sinceLastOpen > TORRENT_TTL_MS) {
      deleteTorrent(hash)
    }
  }

  await localforage.setItem('stored-torrents', storedTorrents)
}

setInterval(cacheCleanup, 30000)
