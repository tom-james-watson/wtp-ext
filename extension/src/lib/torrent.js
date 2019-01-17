import WebTorrent from 'webtorrent'
import createMagnet from './create-magnet'
import logger from './logger'

const client = new WebTorrent()
const torrents = {}

/**
 * Open an infohash as a webtorrent. Cache torrents in-memory.
 *
 * @param {Object} hash - The WTP hash
 * @param {Object} host - The host of URL
 * @param {Object} loadIfNotCached - Whether to load torrent if not cached
 * @returns {Object} Web Torrent
 */
export function openTorrent(hash, host=null, loadIfNotCached=true) {
  logger.info(`Loading torrent for ${hash}`)

  return new Promise((resolve) => {
    if (torrents[hash]) {
      logger.debug(`Torrent loaded from cache.`)
      return resolve(torrents[hash])
    }

    if (!loadIfNotCached) {
      return resolve()
    }

    const magnetUrl = createMagnet(hash)
    logger.debug(`Loading torrent ${magnetUrl}`)

    client.add(magnetUrl, function (torrent) {
      logger.debug(`Torrent loaded successfully.`)

      torrent.on('wire', function (wire, addr) {
        logger.debug('Connected to peer with address ' + addr)
      })

      torrent.on('noPeers', function (announceType) {
        logger.debug('No peers', {announceType})
      })

      checkSubfolders(torrent)

      torrent.host = host

      torrents[hash] = torrent
      resolve(torrent)
    })
  })
}

/**
 * Get all currently-seeded torrents
 *
 * @returns {Array} Torrents
 */
export function getTorrents() {
  return Object.keys(torrents).map(key => torrents[key])
}

/**
 * Delete a torrent
 *
 * Destroy the webtorrent to stop seeding it and clear it from the torrent
 * cache.
 *
 * @param {Object} hash - The hash of the torrent to delete
 */
export function deleteTorrent(hash) {
  return new Promise((resolve, reject) => {
    if (!torrents[hash]) {
      return reject(new Error(`No torrent with hash ${hash}`))
    }

    torrents[hash].destroy(() =>{
      delete torrents[hash]
      resolve()
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
  // Remove preceding slash
  path = path.substr(1)

  // Remove any query params
  path = path.split('?')[0]
  path = path.split('#')[0]

  const parts = path.split('/')
  const fileName = parts[parts.length - 1]

  // Requests to paths without file extensions are assumed to be requests for a
  // `index.html` file in a folder at the given path, e.g. `/blog` will look
  // for a `/blog/index.html` file.
  if (!fileName.includes('.')) {
    if (fileName.length > 0) {
      path += '/'
    }
    path += 'index.html'
  }

  return path
}

/**
 * Check whether the torrent's files are within a subfolder.
 *
 * This will happen if the torrent is created by adding a whole directory, as
 * opposed to the files and folders within that directory. If this is the case,
 * we mark it as such on the torrent and then ignore the top folder when
 * looking up file paths.
 *
 * @param {Object} torrent - Torrent object
 */
export function checkSubfolders(torrent) {

  let folders = new Set([])

  torrent.files.forEach(function(file) {
    if (!file.path.includes('/')) {
      return
    }

    const folder = file.path.split('/').shift()

    if (folder) {
      folders.add(folder)
    }
  })

  folders = Array.from(folders)

  if (folders.length === 1) {
    torrent.subfolder = folders[0]
  }
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
    let filePath = file.path

    if (torrent.subfolder) {
      filePath = filePath.replace(`${torrent.subfolder}/`, '')
    }

    if (filePath === path) {
      return true
    }
  })

  if (!file) {
    logger.error(`Could not find file ${path} in torrent.`)
    throw new Error(`Could not find file ${path} in torrent.`)
  }

  logger.debug(`Successfully found file ${path}.`)

  return file
}

/**
 * Stream a file. This returns a ReadableStream containing chunks of the file
 * as they are read from the torrent.
 *
 * @param {Object} file - File object
 * @returns {ReadableStream} Content of file
 */
export function streamFile(file) {
  const fileStream = file.createReadStream({start: 0, end: file.length})

  let cancelled = false

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of fileStream) {
        if (cancelled) {
          break
        }
        controller.enqueue(new Buffer(chunk))
      }
      controller.close()
    },
    cancel() {
      cancelled = true
    }
  })
}
