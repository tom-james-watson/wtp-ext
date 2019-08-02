import urlLib from 'url'
import datDns from 'dat-dns'

const wtpDns = datDns({
  recordName: 'wtp',
  hashRegex: /^[0-9a-f]{40}?$/i,
  protocolRegex: /^wtp:\/\/([0-9a-f]{40})/i,
  txtRegex: /^"?wtpkey=([0-9a-f]{40})"?$/i,
  dnsHost: 'cloudflare-dns.com',
  dnsPath: '/dns-query'
})

/**
 * Digests a WTP url into a magnet URL and a file path.
 *
 * If the url is not directly an infohash, perform a DNS lookup to resolve the
 * domain into an infohash.
 *
 * @param {Object} request - WTP url
 * @returns {Object} {magnetUrl, path}
 */
export default async function digestUrl(url) {
  let {
    protocol,
    host,
    path
  } = urlLib.parse(url)

  if (protocol !== 'wtp:') {
    throw new Error('Not a WTP URL')
  }

  let hash
  if (host.indexOf('.') > -1) {
    hash = await wtpDns.resolveName(host)
  } else if (host.length === 40) {
    hash = host
  } else {
    throw new Error('Not a WTP URL')
  }

  path = path || '/'

  return {hash, host, path}
}
