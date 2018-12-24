import logger from './lib/logger'

/**
 * Async generator for the default response content.
 *
 * @param {Object} request - Request object
 * @returns {Generator} Default response content
 */
async function* defaultResponse(request) {
  const encoder = new TextEncoder('utf-8')
  yield encoder.encode('<h1>400 - Invalid WTP URL</h1>\n').buffer
  yield encoder.encode(
    `<p><strong>${request.url}</strong> is not a valid WTP URL<p>`
  ).buffer
  yield encoder.encode(
    '<p>A valid WTP URL looks like <strong>wtp://cae9b2e54bf5bf9881b5375fd45b9f953ad0a2ac</strong>'
  ).buffer
}

/**
 * Handler for the default response.
 *
 * @param {Object} request - Request object
 * @returns {Object} Default response
 */
export default function defaultRespond(request) {
  logger.debug('Returning default response')

  return {
    contentType: 'text/html',
    content: defaultResponse(request)
  }
}
