import WebTorrent from 'webtorrent'
import localforage from 'localforage'
import createMagnet from './create-magnet'
import logger from './logger'
import WebChunkStore from './web-chunk-store'

const client = new WebTorrent()
const torrents = {}

/**
 * Perform necessary initialization of localforage and load stored torrents.
 */
export async function init() {
  localforage.config({
    name: 'WTP',
    description: 'WTP torrent store'
  })

  const storedTorrents = await localforage.getItem('stored-torrents') || {}

  for (const hash in storedTorrents) {
    // Don't block event loop - we can lazily load torrents
    openTorrent(hash, storedTorrents[hash].host, true, storedTorrents[hash].seed)
  }
}

/**
 * Open an infohash as a webtorrent. Cache torrents in-memory.
 *
 * @param {Object} hash - The WTP hash
 * @param {Object} host - The host of URL
 * @param {Object} loadIfNotCached - Whether to load torrent if not cached
 * @param {Object} seed - Whether to mark the torrent as seeded
 * @returns {Object} Web Torrent
 */
export function openTorrent(hash, host=null, loadIfNotCached=true, seed=false) {
  if (torrents[hash] && !torrents[hash].loading) {
    // Torrent is fully loaded
    return torrents[hash]
  }

  if (torrents[hash] && !loadIfNotCached) {
    // Torrent is loading and we just want the info, not to load the torrent
    return torrents[hash]
  }

  if (!loadIfNotCached) {
    // Torrent
    // torrent object
    return
  }

  if (torrents[hash]) {
    return torrents[hash].addPromise
  }

  const addPromise = new Promise(async (resolve) => {
    const magnetUrl = createMagnet(hash)
    logger.info(`Loading ${hash}`)

    client.add(magnetUrl, {store: WebChunkStore}, async (torrent) => {
      logger.debug(`Successfully loaded ${hash}`)

      checkSubfolders(torrent)

      torrent.host = host
      torrent.seed = seed
      torrent.loading = false
      torrents[hash] = torrent

      const storedTorrents = await localforage.getItem('stored-torrents') || {}
      if (!(hash in storedTorrents)) {
        storedTorrents[hash] = {hash, host, seed: false, lastOpen: new Date().toISOString()}
        await localforage.setItem('stored-torrents', storedTorrents)
      }

      resolve(torrent)
    })
  })

  torrents[hash] = {
    infoHash: hash,
    host,
    seed,
    loading: true,
    addPromise
  }

  return addPromise
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
  logger.info(`Deleting ${hash}`)

  return new Promise((resolve, reject) => {
    if (!torrents[hash]) {
      return reject(new Error(`No torrent with hash ${hash}`))
    }

    async function deleteLocal() {
      delete torrents[hash]

      const storedTorrents = await localforage.getItem('stored-torrents') || {}
      delete storedTorrents[hash]
      await localforage.setItem('stored-torrents', storedTorrents)

      resolve()
    }

    if (torrents[hash].destroy) {
      torrents[hash].destroy(deleteLocal)
    } else {
      // The torrent never finished loading, just directly delete the local copy
      deleteLocal()
    }
  })
}

/**
 * Toggle whether to permanently seed a torrent.
 *
 * @param {Object} hash - The hash of the torrent to seed
 * @param {Boolean} seed - Whether to seed or not
 */
export async function toggleSeedTorrent(hash, seed) {
  if (!torrents[hash]) {
    throw new Error(`No torrent with hash ${hash}`)
  }

  if (seed) {
    logger.info(`Seeding ${hash}`)
  } else {
    logger.info(`Stopping seeding ${hash}`)
  }

  torrents[hash].seed = seed

  const storedTorrents = await localforage.getItem('stored-torrents') || {}
  storedTorrents[hash].seed = seed
  await localforage.setItem('stored-torrents', storedTorrents)
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
