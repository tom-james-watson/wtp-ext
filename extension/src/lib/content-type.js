import mime from 'mime-types'

/**
 * Get the requested path's content type.
 *
 * @param {String} path - URL path
 * @returns {String} Content Type
 */
export default function getContentType(path) {
  const parts = path.split('/')
  const file = parts[parts.length - 1]

  if (file === '') {
    return 'text/html'
  }

  return mime.contentType(file)
}
