import '@babel/polyfill'

import logger from './lib/logger'
import digestUrl from './lib/digest-url'
import wtpRespond from './wtp-respond'
import defaultRespond from './default-respond'
import './lib/messages'
import './lib/browser-action'

localStorage.debug = '*'

logger.info('Initialized wtp.')

/**
 * Register wtp:// protocol handler. This registers a callback that will be
 * called for any requests made to the given protocol. This allows us to return
 * any kind of payload we want.
 *
 * The expected response object is in the form:
 *   {
 *     contentType: <mime type>,
 *     content: <async iterator of ArrayBufers>
 *   }
 *
 *
 * @param {Object} request - Request object to be handled
 * @returns {Object} Response
 */
browser.protocol.registerProtocol('wtp', async request => {
  logger.info(`Handling request for ${request.url}`)

  let parsedUrl
  try {
    parsedUrl = await digestUrl(request.url)
  } catch (err) {
    return defaultRespond(request)
  }

  const {hash, host, path} = parsedUrl
  return wtpRespond(request, hash, host, path)
})
