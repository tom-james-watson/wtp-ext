import urlLib from 'url'
import createMagnet from './create-magnet'

/**
 * Digests a WTP url into a magnet URL and a file path
 *
 * @param {Object} request - WTP url
 * @returns {Object} {magnetUrl, path}
 */
export default function digestUrl(url) {
  const {
    protocol,
    host: hash,
    path
  } = urlLib.parse(url)

  if (protocol !== 'wtp:') {
    throw new Error('Not a WTP URL')
  }

  const magnetUrl = createMagnet(hash)

  return {magnetUrl, path}
}
