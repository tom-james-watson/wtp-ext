import logger from './lib/logger'
import {openTorrent, getFile, streamFile} from './lib/torrent'
import digestUrl from './lib/digest-url'
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

  const {hash, magnetUrl, path} = digestUrl(request.url)
  const torrent = await openTorrent(hash, magnetUrl)

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
