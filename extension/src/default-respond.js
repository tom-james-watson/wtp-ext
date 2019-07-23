import logger from './lib/logger'

/**
 * Async generator for the default response content.
 *
 * @param {Object} request - Request object
 * @returns {Blob} Default response content
 */
function defaultResponse(request) {
  return new Blob([
    '<h1>400 - Invalid WTP URL</h1>\n',
    `<p><strong>${request.url}</strong> is not a valid WTP URL<p>`,
    '<p>A valid WTP URL looks like <strong>wtp://cae9b2e54bf5bf9881b5375fd45b9f953ad0a2ac</strong>'
  ])
}

/**
 * Handler for the default response.
 *
 * @param {Object} request - Request object
 * @returns {Promise.Object} Default response
 */
export default function defaultRespond(request) {
  logger.debug('Returning default response')

  return new Promise((resolve) => {
    resolve(new Response(
      defaultResponse(request),
      {headers: {"content-type": "text/html;charset=utf-8"}},
    ))
  })
}
