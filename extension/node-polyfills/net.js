// net implementation by Substack
// https://gist.github.com/substack/7d694274e2f11f6925299b01b31b2efa

var EventEmitter = require('events').EventEmitter
var Duplex = require('readable-stream').Duplex
var encoder = new TextEncoder
var decoder = new TextDecoder

exports.Server = Server
exports.createServer = function (opts) {
  return new Server(opts)
}
exports.connect = exports.createConnection = connect
exports.Socket = Socket

function connect (...args) {
  var [opts,cb] = normalizeOpts(args)
  if (!opts.host) opts.host = '127.0.0.1'
  var p = browser.TCPSocket.connect(opts)
  var s = new Socket()
  p.then(function (client) {
    client.opened.then(async function () {
      s._setClient(client)
    })
    client.opened.catch(function (err) {
      s.emit('error', err)
    })
  })
  p.catch(function (err) { s.emit('error', err) })
  return s
}

function Server (opts, cb) {
  if (!(this instanceof Server)) return new Server(opts)
  if (typeof opts === 'function') {
    this.on('connection', opts)
    opts = {}
  } else if (typeof cb === 'function') {
    this.on('connection', cb)
  }
  this._closed = false
  this._sockets = []
  this._connections = 0
}
Server.prototype = Object.create(EventEmitter.prototype)

Server.prototype.address = function() {
  return {
    address: '127.0.0.1',
    port: this._handle.localPort,
    family: 'IPv4',
  }
}

Server.prototype.listen = function (...args) {
  var self = this
  var [opts,cb] = normalizeOpts(args)
  if (self._handle) {
    throw new Error('server is already listening')
  }
  if (opts.path) {
    throw new Error('unix sockets are not supported')
  }
  if (typeof cb === 'function') {
    self.once('listening', cb)
  }
  var p = browser.TCPSocket.listen(opts)
  p.then(function (server) {
    self._handle = server
    next()
    self.emit('listening')
  })
  function next () {
    var p = self._handle.connections.next()
    p.then(function (client) {
      if (!client.value) return onclose()
      var s = new Socket({ client: client.value })
      self._sockets.push(s)
      self._connections++
      var closed = false
      s.once('destroy', onclose)
      s.once('close', onclose)
      client.value.opened.then(function () {
        self.emit('connection', s)
      })
      client.value.opened.catch(function (err) {
        s.emit('error', err)
      })
      next()
      function onclose () {
        if (closed) return
        closed = true
        self._connections--
        var ix = self._sockets.indexOf(s)
        if (ix >= 0) self._sockets.splice(s,1)
      }
    })
    p.catch(function (err) { self.emit('error', err) })
  }
}

Server.prototype.close = function (cb) {
  var self = this
  if (!this._handle) {
    throw new Error('server not running')
  }
  if (cb) {
    this.once('close', cb)
  }
  this._sockets.forEach(function (s) {
    s.once('close', onclose)
  })
  this._handle.close()
  this._handle = null
  onclose()

  function onclose () {
    if (self._connections === 0) self.emit('close')
  }
}

function Socket (opts) {
  var self = this
  if (!(self instanceof Socket)) return new Socket(opts)
  Duplex.call(this)
  if (opts && opts.client) this._setClient(opts.client)
}
Socket.prototype = Object.create(Duplex.prototype)
Socket.prototype._setClient = function (client) {
  var self = this
  this._client = client
  this._client.closed.then(function () {
    self.push(null)
    self.emit('close')
  })
  this.emit('_client', client)
  this.emit('connect', this);
}
Socket.prototype._write = function write (buf, enc, next) {
  var self = this
  if (!this._client) {
    this.once('_client', function () { write.call(self, buf, enc, next) })
    return
  }
  try {
    var p = this._client.write(toABuf(buf))
  } catch (err) {
    return next(err)
  }
  p.then(function () { next() })
  p.catch(next)
}
Socket.prototype._final = function final (next) {
  var self = this
  if (!this._client) {
    this.once('_client', function () { final.call(self, next) })
    return;
  }
  this._client.close()
  this._client = null
  this.once('close', next)
}
Socket.prototype._read = function (size) {
  var self = this
  if (!this._client) {
    this.once('_client', function () { self._read(size) })
    return
  }
  var p = self._client.read()
  p.then(function (buf) { self.push(Buffer.from(buf)) })
  p.catch(function (err) { self.emit('error', err) })
}
Socket.prototype.close = function (cb) {
  if (!this._client) {
    if (typeof cb === 'function') cb(new Error('already closed'))
    return
  }
  if (typeof cb === 'function') this.once('close', cb)
  this._client.close()
  this._client = null
}

function toABuf (x) {
  if (x instanceof ArrayBuffer) return x
  if (typeof x === 'string') {
    return encoder.encode(x).buffer
  }
  if (typeof x === 'object' && x && x.buffer instanceof ArrayBuffer) {
    return x.buffer
  }
  throw new Error('expected string, ArrayBuffer, or object with'
    + ' buffer ArrayBuffer property')
}

function normalizeOpts (args) {
  if (args.length === 0) return [{},null]
  var opts
  if (typeof args[0] === 'object' && args[0] !== null) {
    opts = args[0]
  } else if (typeof args[0] === 'string' && !isNumber(args[0])) {
    opts = { path: args[0] } // unix sockets are not supported
  } else {
    opts = { port: args[0] }
    if (args.length > 1 && typeof args[1] === 'string') {
      opts.host = args[1]
    }
  }
  var cb = args[args.length-1]
  if (typeof cb !== 'function') {
    cb = null
  }
  return [opts,cb]
}

function isIPv4(input) {
  const parts = input.split('.');
  if (parts.length === 4) {
    return parts.every((n) => parseInt(n) < 256);
  }
  return false;
}

function isIPv6(input) {
  return false;
}

function isIP(input) {
  if (isIPv4(input)) {
    return 4;
  }
  if (isIPv6(input)) {
    return 6;
  }
  return 0;
}

exports.isIP = isIP;
exports.isIPv4 = isIPv4;
exports.isIPv6 = isIPv6;
