import createMagnet from './create-magnet'

/**
 * Digests a WTP url into a magnet URL and a file path
 *
 * @param {Object} request - WTP url
 * @returns {Object} {magnetUrl, path}
 */
export default function digestUrl(url) {
  const hash = url.substr(6, 40)
  const magnetUrl = createMagnet(hash)
  const path = url.substr(46)

  return {magnetUrl, path}
}
