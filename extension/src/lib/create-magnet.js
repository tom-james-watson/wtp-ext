const trackers = [
  'udp://explodie.org:6969',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://tracker.empire-js.us:1337',
  'udp://tracker.leechers-paradise.org:6969',
  'udp://tracker.opentrackr.org:1337',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
  'wss://tracker.openwebtorrent.com'
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
