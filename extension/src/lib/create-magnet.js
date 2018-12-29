const trackers = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.fastcast.nz'
]

/**
 * Create a magnet URL for a hash.
 *
 * Also adds a set of default trackers.
 *
 * @param {Object} hash - Magnet hash
 * @returns {String} Magnet URL
 */
export default function createMagnet(hash) {
  let magnetUrl = `magnet:?xt=urn:btih:${hash}`

  for (const tracker of trackers) {
    magnetUrl += `&tr=${tracker}`
  }

  return magnetUrl
}
