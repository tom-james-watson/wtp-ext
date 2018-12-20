import defaultRespond from './default-respond'
import wtpRespond from './wtp-respond'
import logger from './lib/logger'

logger.info('Initialized wtp.')

/**
 * Get the handler that should be used for the given request.
 *
 * @param {Object} request - Request object
 * @returns {Function} Handler function for this request
 */
function getHandler(request) {
  if (request.url.length < 47) {
    return defaultRespond
  }

  const hash = request.url.split('/')[2]

  if (hash.length !== 40) {
    return defaultRespond
  }

  return wtpRespond
}

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
browser.protocol.registerProtocol('wtp', request => {
  logger.info(`Handling request for ${request.url}`)
  const handler = getHandler(request)
  return handler(request)
})
