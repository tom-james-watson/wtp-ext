const trackers = [
  'udp://tracker.opentrackr.org:1337'
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
