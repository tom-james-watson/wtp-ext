import logger from './lib/logger'
import {openTorrent, getFile, streamFile} from './lib/torrent'
import getContentType from './lib/content-type'

/**
 * Handler for valid WTP urls.
 *
 * Takes a WTP infohash and opens it as a webtorrent. Then, based on the URL's
 * path, load the correct file from the webtorrent. Stream the content from the
 * file into the response's content.
 *
 * @param {Object} request - Request object
 * @param {String} hash - WTP infohash
 * @param {String} host - Host of URL
 * @param {String} path - Path of file to load
 * @returns {Object} WTP response
 */
export default async function wtpRespond(request, hash, host, path) {
  logger.debug('Returning wtp response')
  const torrent = await openTorrent(hash, host)

  const file = getFile(torrent, path)
  const contentType = getContentType(path)

  logger.debug(`Returning ${path} with contentType ${contentType}`)

  return new Promise((resolve) => {
    resolve(new Response(
      streamFile(file),
      {
        headers: {"content-type": contentType},
        contentLength: file.length
      }
    ))
  })
}
