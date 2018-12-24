import WebTorrent from 'webtorrent'
import logger from './logger'

const client = new WebTorrent()
const torrents = {}

/**
 * Open a magnet URL as a webtorrent. Cache torrents in-memory.
 *
 * @param {Object} magnetUrl - Magnet URL of torrent
 * @returns {Object} Web Torrent
 */
export function openTorrent(magnetUrl) {
  logger.info(`Loading torrent for ${magnetUrl}`)

  return new Promise((resolve) => {
    if (torrents[magnetUrl]) {
      logger.debug(`Torrent loaded from cache.`)
      return resolve(torrents[magnetUrl])
    }

    client.add(magnetUrl, function (torrent) {
      logger.debug(`Torrent loaded successfully.`)
      torrents[magnetUrl] = torrent
      resolve(torrent)
    })
  })
}

/**
 * Convert a URL path into a torrent filepath.
 *
 * @param {Object} path - Path of file from URL
 * @returns {String} Path to file in torrent
 */
export function getPath(path) {
  path = path.split('?')[0]
  path = path.split('#')[0]

  const parts = path.split('/')
  const fileName = parts[parts.length - 1]

  if (!fileName.includes('.')) {
    if (fileName.length > 0) {
      path += '/'
    }
    path += 'index.html'
  }

  return path
}

/**
 * Get a file object from a torrent for a given path.
 *
 * @param {Object} torrent - Torrent object
 * @param {String} path - Path of file to get
 * @returns {Object} File
 */
export function getFile(torrent, path) {
  path = getPath(path)
  logger.debug(`Searching for file ${path}.`)

  const file = torrent.files.find(function (file) {
    const fileParts = file.path.split('/')
    fileParts.shift()
    const filePath = `/${fileParts.join('/')}`
    if (filePath === path) {
      return true
    }
  })

  if (!file) {
    throw `Could not find file ${path} in torrent.`
  }

  logger.debug(`Successfully found file ${path}.`)

  return file
}

/**
 * Stream a file. This is an async generator that yields chunks of the stream
 * as they are read.
 *
 * @param {Object} file - File object
 * @returns {Generator} Content of file
 */
export async function* streamFile(file) {
  const fileStream = file.createReadStream({start: 0, end: file.length})

  for await (const chunk of fileStream) {
    yield new Buffer(chunk).buffer
  }
}
