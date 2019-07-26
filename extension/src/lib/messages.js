import digestUrl from './digest-url'
import {openTorrent} from './torrent'

async function getTorrentDetails({url}) {
  const {magnetUrl} = digestUrl(url)
  const torrent = await openTorrent(magnetUrl)

  return {
    timeRemaining: torrent.timeRemaining,
    downloaded: torrent.downloaded,
    received: torrent.received,
    uploaded: torrent.uploaded,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    progress: torrent.progress,
    ratio: torrent.ratio,
    path: torrent.path,
    infoHash: torrent.infoHash,
    numPeers: torrent.numPeers,
  }
}

const handlers = {
  'get-torrent-details': getTorrentDetails
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const {type} = message
  const handler = handlers[type]

  sendResponse(new Promise(async (resolve) => {
    resolve(await handler(message))
  }))
})
