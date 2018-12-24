import mime from 'mime'

/**
 * Get the requested path's content type.
 *
 * @param {String} path - URL path
 * @returns {String} Content Type
 */
export default function getContentType(path) {
  let contentType = mime.getType(path)

  if (contentType === null) {
    contentType = 'text/html'
  }

  return contentType
}
