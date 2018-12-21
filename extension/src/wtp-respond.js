import logger from './lib/logger'
import createMagnet from './lib/create-magnet'
import {openTorrent, getFile, waitForFile, getFileBuffer, streamBuffer, streamFile} from './lib/torrent'
import getContentType from './lib/content-type'

/**
 * Handler for valid WTP urls.
 *
 * Convert the WTP hash into a magnet URL and open it as a webtorrent. Then,
 * based on the URL's path, load the correct file from the webtorrent. Stream
 * the content from the file into the response's content.
 *
 * @param {Object} request - Request object
 * @returns {Object} WTP response
 */
export default async function torrentRespond(request) {
  logger.debug('Returning wtp response')

  const hash = request.url.substr(6, 40)
  const magnetUrl = createMagnet(hash)
  const path = request.url.substr(46)

  const torrent = await openTorrent(magnetUrl)

  const file = getFile(torrent, path)
  const contentType = getContentType(path)

  await waitForFile(file)

  const buffer = await getFileBuffer(file)

  logger.debug(`Returning ${path} with contentType ${contentType}`)

  return {
    contentType,
    contentLength: file.length,
    content: streamBuffer(buffer)
  }
}
