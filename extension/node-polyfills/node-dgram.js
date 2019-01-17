const EventEmitter = require("events")
const {Buffer} = require("buffer")
const assert = require("assert")

const isUint8Array = value => value instanceof Uint8Array

const Bind = {
  BIND_STATE_UNBOUND: 0,
  BIND_STATE_BINDING: 1,
  BIND_STATE_BOUND: 2
}

function dgram(lib) {
  class Socket extends EventEmitter {
    constructor(type, listener) {
      super()

      if (type !== null && typeof type === "object") {
        const options = type
        this.type = options.type
        this.dns = options.lookup ? fromNodeLookup(options.lookup) : lib.dns
        this._reuseAddr = !!options.reuseAddr
      } else {
        this._reuseAddr = false
        this.type = type
        this.dns = lib.dns
      }

      if (typeof listener === "function") {
        this.on("message", listener)
      }

      this.isIdle = true
      this._handle = null
      this._bindState = Bind.BIND_STATE_UNBOUND
      this.workQueue = []
    }

    _healthCheck() {
      if (!this._handle) {
        // Error message from dgram_legacy.js.
        throw new ERR_SOCKET_DGRAM_NOT_RUNNING()
      }
      return this._handle
    }

    send(buffer, ...args) {
      let [offset, length, port, address, callback] = args
      let list

      if (address || (port && typeof port !== "function")) {
        buffer = sliceBuffer(buffer, offset, length)
      } else {
        callback = port
        port = offset
        address = length
      }

      if (!Array.isArray(buffer)) {
        if (typeof buffer === "string") {
          list = [Buffer.from(buffer)]
        } else if (!isUint8Array(buffer)) {
          throw new ERR_INVALID_ARG_TYPE(
            "buffer",
            ["Buffer", "Uint8Array", "string"],
            buffer
          )
        } else {
          list = [buffer]
        }
      } else if (!(list = fixBufferList(buffer))) {
        throw new ERR_INVALID_ARG_TYPE(
          "buffer list arguments",
          ["Buffer", "string"],
          buffer
        )
      }

      port >>>= 0
      if (port === 0 || port > 65535) {
        throw new ERR_SOCKET_BAD_PORT(port)
      }

      // Normalize callback so it's either a function or undefined but not anything
      // else.
      if (typeof callback !== "function") {
        callback = undefined
      }

      if (typeof address === "function") {
        callback = address
        address = undefined
      } else if (address && typeof address !== "string") {
        throw new ERR_INVALID_ARG_TYPE("address", ["string", "falsy"], address)
      }

      if (this._bindState === Bind.BIND_STATE_UNBOUND) {
        this.bind({port: 0, exclusive: true}, null)
      }

      if (list.length === 0) {
        list.push(Buffer.alloc(0))
      }

      const host = address || (this.type === "udp4" ? "127.0.0.1" : "::1")
      this.schedule(new Send(this, list, port, host, callback))
    }

    close(callback) {
      if (typeof callback === "function") {
        this.on("close", callback)
      }

      this.schedule(new Close(this))
    }

    schedule(task) {
      this.workQueue.push(task)
      if (this.isIdle) {
        this.awake()
      }
    }

    async awake() {
      if (this.isIdle) {
        this.isIdle = false
        const {workQueue} = this
        let index = 0
        while (index < workQueue.length) {
          const task = workQueue[index++]
          await task.perform()
        }
        workQueue.length = 0
        this.isIdle = true
      }
    }

    address() {
      const {host, port, family} = this._healthCheck().address
      return {
        address: host,
        host,
        port,
        family: toNodeFamily(family)
      }
    }

    setMulticastLoopback(flag) {
      const socket = this._healthCheck()

      try {
        lib.UDPSocket.setMulticastLoopback(socket, flag)
      } catch (error) {
        throw errnoException(error, "setMulticastLoopback")
      }
    }

    setMulticastInterface(interfaceAddress) {
      const socket = this._healthCheck()

      if (typeof interfaceAddress !== "string") {
        throw new ERR_INVALID_ARG_TYPE(
          "interfaceAddress",
          "string",
          interfaceAddress
        )
      }

      try {
        lib.UDPSocket.setMulticastInterface(socket, interfaceAddress)
      } catch (error) {
        throw errnoException(error, "setMulticastInterface")
      }
    }

    addMembership(multicastAddress, interfaceAddress) {
      const socket = this._healthCheck()

      if (!multicastAddress) {
        throw new ERR_MISSING_ARGS("multicastAddress")
      }

      try {
        lib.UDPSocket.addMembership(socket, multicastAddress, interfaceAddress)
      } catch (error) {
        throw errnoException(error, "addMembership")
      }
    }

    dropMembership(multicastAddress, interfaceAddress) {
      const socket = this._healthCheck()

      if (!multicastAddress) {
        throw new ERR_MISSING_ARGS("multicastAddress")
      }

      try {
        lib.UDPSocket.dropMembership(
          socket,
          multicastAddress,
          interfaceAddress || undefined
        )
      } catch (error) {
        throw errnoException(error, "dropMembership")
      }
    }

    bind(...args) {
      let [port_, address_] = args
      let port = port_

      if (this._bindState !== Bind.BIND_STATE_UNBOUND) {
        throw new ERR_SOCKET_ALREADY_BOUND()
      }

      this._bindState = Bind.BIND_STATE_BINDING

      if (
        arguments.length &&
        typeof arguments[arguments.length - 1] === "function"
      ) {
        this.once("listening", arguments[arguments.length - 1])
      }

      let address

      if (port !== null && typeof port === "object") {
        address = port.address || ""
        port = port.port
      } else {
        address = typeof address_ === "function" ? "" : address_
      }

      // defaulting address for bind to all interfaces
      if (!address) {
        address = this.type === 'udp4' ? '0.0.0.0' : "::"
      }

      this.schedule(new Spawn(this, address, port))

      return this
    }
  }

  class Spawn {
    constructor(socket, address, port) {
      this.socket = socket
      this.address = address
      this.port = port
    }

    async perform() {
      const {socket, address, port} = this
      try {
        const record = await socket.dns.resolve(address)
        const host = record.addresses[0]
        const addressReuse = socket._reuseAddr
        const options =
          port !== undefined && port !== 0
            ? {host, port, addressReuse}
            : {host, addressReuse}

        const _handle = await lib.UDPSocket.create(options)
        socket._handle = _handle
        socket.emit("listening", this)
        listen(socket, _handle)
      } catch (error) {
        socket._bindState = Bind.BIND_STATE_UNBOUND
        socket.emit("error", error)
      }
    }
  }

  class Send {
    constructor(socket, list, port, address, callback) {
      this.socket = socket
      this.list = list
      this.port = port
      this.address = address
      this.callback = callback
    }

    async perform() {
      const {socket, list, port, address, callback} = this
      const {_handle} = socket
      const host = (await socket.dns.resolve(address)).addresses[0]

      if (_handle) {
        try {
          for (const {buffer} of list) {
            await lib.UDPSocket.send(_handle, host, port, buffer)
          }

          // As far as I can tell there is no way to tell when send message
          // was drained https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/dom/webidl/UDPSocket.webidl#L39
          // There for we just wait 20ms instead.
          if (callback) {
            await new Promise(resolve => setTimeout(resolve, 20))
            callback(null)
          }
        } catch (error) {
          if (callback) {
            callback(error)
          }
        }
      }
    }
  }

  class Close {
    constructor(socket) {
      this.socket = socket
    }

    async perform() {
      const {socket} = this
      try {
        const handle = socket._healthCheck()
        socket._handle = null
        await lib.UDPSocket.close(handle)
        // socket.emit("close")
      } catch (error) {
        socket.emit("error", error)
      }
    }
  }

  const listen = async function(socket, handle) {
    for await (const {data, from} of lib.UDPSocket.messages(handle)) {
      socket.emit("message", Buffer.from(data), {
        address: from.host,
        family: toNodeFamily(from.family),
        port: from.port,
        size: data.byteLength
      })
    }
    socket.emit("close")
  }

  const createSocket = (options, callback) => {
    return new Socket(options, callback)
  }

  return {createSocket, Socket}
}

function oneOf(expected, thing) {
  assert(typeof thing === "string", "`thing` has to be of type string")
  if (Array.isArray(expected)) {
    const len = expected.length
    assert(len > 0, "At least one expected value needs to be specified")
    expected = expected.map(i => String(i))
    if (len > 2) {
      return (
        `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` +
        expected[len - 1]
      )
    } else if (len === 2) {
      return `one of ${thing} ${expected[0]} or ${expected[1]}`
    } else {
      return `of ${thing} ${expected[0]}`
    }
  } else {
    return `of ${thing} ${String(expected)}`
  }
}

class ERR_INVALID_ARG_TYPE extends TypeError {
  constructor(name, expected, actual) {
    // determiner: 'must be' or 'must not be'
    let determiner
    if (typeof expected === "string" && expected.startsWith("not ")) {
      determiner = "must not be"
      expected = expected.replace(/^not /, "")
    } else {
      determiner = "must be"
    }

    let msg
    if (name.endsWith(" argument")) {
      // For cases like 'first argument'
      msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`
    } else {
      const type = name.includes(".") ? "property" : "argument"
      msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, "type")}`
    }

    // TODO(BridgeAR): Improve the output by showing `null` and similar.
    msg += `. Received type ${typeof actual}`
    super(msg)
  }
}

class ERR_MISSING_ARGS extends TypeError {
  constructor(...params) {
    let msg = "The "
    const len = params.length
    const args = params.map(a => `"${a}"`)
    switch (len) {
      case 1:
        msg += `${args[0]} argument`
        break
      case 2:
        msg += `${args[0]} and ${args[1]} arguments`
        break
      default:
        msg += args.slice(0, len - 1).join(", ")
        msg += `, and ${args[len - 1]} arguments`
        break
    }
    super(`${msg} must be specified`)
  }
}

class ERR_SOCKET_ALREADY_BOUND extends Error {
  constructor() {
    super("Socket is already bound")
  }
}

class ERR_SOCKET_BAD_PORT extends RangeError {
  constructor(port) {
    super("Port should be > 0 and < 65536. Received ${port}.")
  }
}

class ERR_SOCKET_DGRAM_NOT_RUNNING extends Error {
  constructor() {
    super("Not running")
  }
}

class SystemError extends Error {
  constructor(message, code, syscall) {
    super(message)
    this.code = code
    this.syscall = syscall
  }
  get errno() {
    return this.code
  }
}

const errnoException = (err, syscall, original) => {
  const code = err.message
  const message = original
    ? `${syscall} ${code} ${original}`
    : `${syscall} ${code}`

  // eslint-disable-next-line no-restricted-syntax
  const ex = new SystemError(message, code, syscall)

  return ex
}

function sliceBuffer(source, offset, length) {
  let buffer = source
  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer)
  } else if (!isUint8Array(buffer)) {
    throw new ERR_INVALID_ARG_TYPE(
      "buffer",
      ["Buffer", "Uint8Array", "string"],
      buffer
    )
  }

  const start = offset >>> 0
  const end = start + (length >>> 0)

  return buffer.slice(start, end)
}

function fixBufferList(list) {
  const newlist = new Array(list.length)

  for (let i = 0; i < list.length; i++) {
    const buf = list[i]
    if (typeof buf === "string") {
      newlist[i] = Buffer.from(buf)
    } else if (!isUint8Array(buf)) {
      return null
    } else {
      newlist[i] = buf
    }
  }

  return newlist
}

const toNodeFamily = family => (family === 2 ? "udp6" : "udp4")

const fromNodeLookup = (lookup) => ({
  resolve: (hostname) =>
    new Promise((resolve, reject) => {
      lookup(hostname, (error, address, family) => {
        if (error) {
          reject(error)
        } else {
          resolve({addresses: [address]})
        }
      })
    })
})

module.exports = dgram
