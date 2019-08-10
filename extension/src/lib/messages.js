import logger from './logger'
import digestUrl from './digest-url'
import {getTorrent, getTorrents, deleteTorrent, toggleSeedTorrent} from './torrent'

function formatTorrent(torrent) {
  return {
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    progress: torrent.progress,
    infoHash: torrent.infoHash,
    host: torrent.host,
    numPeers: torrent.numPeers,
    seed: torrent.seed,
    loading: torrent.loading,
  }
}

async function onGetCurrentTorrent({url}) {
  try {
    const {hash} = await digestUrl(url)
    const torrent = await getTorrent(hash)
    return formatTorrent(torrent)
  } catch (err) {
    console.error(err)
    return null
  }
}

async function onGetAllTorrents({url}) {
  const torrents = await getTorrents()
  return torrents.map(formatTorrent)
}

async function onDeleteTorrent({hash}) {
  try {
    await deleteTorrent(hash)
    return true
  } catch (err) {
    logger.error('Failed to delete torrent', {err})
    return false
  }
}

async function onToggleSeedTorrent({hash, seed}) {
  await toggleSeedTorrent(hash, seed)
}

const handlers = {
  'get-current-torrent': onGetCurrentTorrent,
  'get-all-torrents': onGetAllTorrents,
  'delete-torrent': onDeleteTorrent,
  'toggle-seed-torrent': onToggleSeedTorrent
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const {type} = message
  const handler = handlers[type]

  sendResponse(new Promise(async (resolve) => {
    resolve(await handler(message))
  }))
})
