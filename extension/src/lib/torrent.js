import WebTorrent from 'webtorrent'
import toArrayBuffer from 'to-arraybuffer'
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
 * Get a file object from a torrent for a given path.
 *
 * @param {Object} torrent - Torrent object
 * @param {String} path - Path of file to get
 * @returns {Object} File
 */
export function getFile(torrent, path) {
  if (path === '/') {
    path = '/index.html'
  }

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
 * Wait for a file to finish downloading.
 *
 * @param {Object} file - File object
 */
export function waitForFile(file) {
  return new Promise((resolve) => {
    const poll = function() {
      logger.debug({
        downloaded: file.downloaded,
        path: file.path,
        name: file.name,
        length: file.length,
        progress: file.progress
      })
      if (file.progress === 1) {
        return resolve()
      }
      setTimeout(poll, 50)
    }
    poll()
  })
}

/**
 * Get the a buffer of the contents of a file.
 *
 * @param {ArrayBuffer} file - File object
 * @returns {ArrayBuffer} Buffer of file's contents
 */
export function getFileBuffer(file) {
  return new Promise((resolve) => {
    file.getBuffer(function(err, buffer) {
      resolve(buffer.buffer)
    })
  })
}

/**
 * Stream the buffer. The protocol handler response content is expected to be
 * an async generator, so simply yield the buffer.
 *
 * @param {ArrayBuffer} buffer - The buffer to be streamed
 * @returns {Generator} Async generator over buffer
 */
export async function* streamBuffer(buffer) {
  yield buffer
}

/**
 * Stream a file. This is an async generator that yields chunks of the stream
 * as they are read.
 *
 * @param {Object} file - File object
 * @returns {Generator} Content of file
 */
export async function* streamFile(file) {
  const fileStream = file.createReadStream()

  for await (const chunk of fileStream) {
    yield chunk.buffer
  }
}
