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

async function getOtherTorrents({url}) {
  const torrents = await getTorrents()
  return torrents.map(formatTorrent)
}

const handlers = {
  'get-current-torrent': getCurrentTorrent,
  'get-all-torrents': getOtherTorrents
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const {type} = message
  const handler = handlers[type]

  sendResponse(new Promise(async (resolve) => {
    resolve(await handler(message))
  }))
})
