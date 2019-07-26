import digestUrl from './digest-url'
import {openTorrent, getTorrents} from './torrent'

function formatTorrent(torrent) {
  return {
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    progress: torrent.progress,
    infoHash: torrent.infoHash,
    numPeers: torrent.numPeers,
  }
}

async function getCurrentTorrent({url}) {
  let magnetUrl
  try {
    magnetUrl = digestUrl(url).magnetUrl
  } catch (err) {
    return null
  }

  const torrent = await openTorrent(magnetUrl)

  return formatTorrent(torrent)
}

async function getTorrentStatuses({url}) {
  const currentTorrent = await getCurrentTorrent({url})
  let otherTorrents = await getTorrents()

  otherTorrents = otherTorrents.map(formatTorrent).filter(torrent => {
    console.log({torrent, currentTorrent})
    return !currentTorrent || torrent.infoHash !== currentTorrent.infoHash
  })

  return {
    currentTorrent,
    otherTorrents
  }
}

const handlers = {
  'get-torrent-statuses': getTorrentStatuses,
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const {type} = message
  const handler = handlers[type]

  sendResponse(new Promise(async (resolve) => {
    resolve(await handler(message))
  }))
})
