async function lookup(host, options, cb) {
  if (!cb) {
    cb = options
    options = {}
  }

  try {
    const result = await browser.dns.resolve(host)
    cb(null, result)
  } catch (e) {
    cb(e)
  }
}

async function resolve4(hostname, options, callback) {
  if (!callback) {
    callback = options
    options = {}
  }
  const address = await browser.dns.resolve(hostname, 4, true)
  callback(null, address)
}

async function resolve6(hostname, options, callback) {
  if (!callback) {
    callback = options
    options = {}
  }
  const address = await browser.dns.resolve(hostname, 6, true)
  callback(null, address)
}

async function resolveAny(hostname, options, callback) {
  if (!callback) {
    callback = options
    options = {}
  }
  const address = await browser.dns.resolve(hostname, null, true)
  callback(null, address.map(addr => ({address: addr})))
}

function resolve(hostname, rrtype, callback) {
  if (!callback) {
    callback = rrtype
    rrtype = 'A'
  }
  const returnFirstResult = (err, r) => callback(err, r && r[0])
  switch (rrtype) {
    case 'A':
      resolve4(hostname, returnFirstResult)
      break
    case 'AAAA':
      resolve6(hostname, returnFirstResult)
      break
    case 'ANY':
      resolveAny(hostname, returnFirstResult)
      break
    default:
      // pass
  }
}

module.exports = {
  resolve,
  lookup,
  resolveAny,
  resolve4,
  resolve6,
}
