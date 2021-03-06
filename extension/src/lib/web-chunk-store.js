import thunky from 'thunky'
import RandomAccessWeb from 'random-access-web'

const randomAccessWeb = RandomAccessWeb('wtp')

/**
 * An abstract-chunk-store compliant chunk store based on random-access-web.
 *
 * This will use whichever API is available out of:
 *  * requestFileSystem (chrome-specific API)
 *  * IDBMutableFile (firefox-specific API)
 *  * indexedDB
 */
export default function Storage (chunkLength, opts) {
  const self = this

  if (!(self instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}

  self.chunkLength = Number(chunkLength)
  if (!self.chunkLength) throw new Error('First argument must be a chunk length')

  if (!Array.isArray(opts.files)) {
    throw new Error('`files` option must be an array')
  }
  self.files = opts.files.slice(0).map(function (file, i, files) {
    if (file.path === null) throw new Error('File is missing `path` property')
    if (file.length === null) throw new Error('File is missing `length` property')
    if (file.offset === null) {
      if (i === 0) {
        file.offset = 0
      } else {
        const prevFile = files[i - 1]
        file.offset = prevFile.offset + prevFile.length
      }
    }
    return file
  })
  self.length = self.files.reduce(function (sum, file) {
    return sum + file.length
  }, 0)
  if (opts.length !== null && opts.length !== self.length) {
    throw new Error('total `files` length is not equal to explicit `length` option')
  }

  self.chunkMap = []
  self.closed = false

  // let i = 0
  self.files.forEach(function (file) {
    // file.path = i
    // i++
    file.open = thunky(async function (cb) {
      if (self.closed) return cb(new Error('Storage is closed'))
      cb(null, randomAccessWeb(file.path))
    })
  })

  // If the length is Infinity (i.e. a length was not specified) then the store will
  // automatically grow.

  if (self.length !== Infinity) {
    self.lastChunkLength = (self.length % self.chunkLength) || self.chunkLength
    self.lastChunkIndex = Math.ceil(self.length / self.chunkLength) - 1

    self.files.forEach(function (file) {
      const fileStart = file.offset
      const fileEnd = file.offset + file.length

      const firstChunk = Math.floor(fileStart / self.chunkLength)
      const lastChunk = Math.floor((fileEnd - 1) / self.chunkLength)

      for (let p = firstChunk; p <= lastChunk; ++p) {
        const chunkStart = p * self.chunkLength
        const chunkEnd = chunkStart + self.chunkLength

        const from = (fileStart < chunkStart) ? 0 : fileStart - chunkStart
        const to = (fileEnd > chunkEnd) ? self.chunkLength : fileEnd - chunkStart
        const offset = (fileStart > chunkStart) ? 0 : chunkStart - fileStart

        if (!self.chunkMap[p]) self.chunkMap[p] = []

        self.chunkMap[p].push({
          from: from,
          to: to,
          offset: offset,
          file: file
        })
      }
    })
  }
}

Storage.prototype.put = async function (index, buf, cb) {
  const self = this
  if (typeof cb !== 'function') cb = noop
  if (self.closed) return nextTick(cb, new Error('Storage is closed'))

  const isLastChunk = (index === self.lastChunkIndex)
  if (isLastChunk && buf.length !== self.lastChunkLength) {
    return nextTick(cb, new Error('Last chunk length must be ' + self.lastChunkLength))
  }
  if (!isLastChunk && buf.length !== self.chunkLength) {
    return nextTick(cb, new Error('Chunk length must be ' + self.chunkLength))
  }

  if (self.length === Infinity) {
    self.files[0].open(async function (err, file) {
      if (err) return cb(err)
      file.write(index * self.chunkLength, buf, cb)
    })
  } else {
    const targets = self.chunkMap[index]
    if (!targets) return nextTick(cb, new Error('no files matching the request range'))
    const tasks = targets.map(function (target) {
      return new Promise((resolve, reject) => {
        target.file.open(async function (err, file) {
          if (err) return reject(err)
          file.write(target.offset, buf.slice(target.from, target.to), (err) => {
            if (err) return reject(err)
            resolve()
          })
        })
      })
    })
    try {
      await Promise.all(tasks)
      cb()
    } catch (err) {
      cb(err)
    }
  }
}

Storage.prototype.get = async function (index, opts, cb) {
  const self = this
  if (typeof opts === 'function') return self.get(index, null, opts)
  if (self.closed) return nextTick(cb, new Error('Storage is closed'))

  const chunkLength = (index === self.lastChunkIndex)
    ? self.lastChunkLength
    : self.chunkLength

  const rangeFrom = (opts && opts.offset) || 0
  const rangeTo = (opts && opts.length) ? rangeFrom + opts.length : chunkLength

  if (rangeFrom < 0 || rangeFrom < 0 || rangeTo > chunkLength) {
    return nextTick(cb, new Error('Invalid offset and/or length'))
  }

  if (self.length === Infinity) {
    if (rangeFrom === rangeTo) return nextTick(cb, null, Buffer.from(0))
    self.files[0].open(async function (err, file) {
      if (err) return cb(err)
      const offset = (index * self.chunkLength) + rangeFrom
      file.read(offset, rangeTo - rangeFrom, cb)
    })
  } else {
    let targets = self.chunkMap[index]
    if (!targets) return nextTick(cb, new Error('no files matching the request range'))
    if (opts) {
      targets = targets.filter(function (target) {
        return target.to > rangeFrom && target.from < rangeTo
      })
      if (targets.length === 0) {
        return nextTick(cb, new Error('no files matching the requested range'))
      }
    }
    if (rangeFrom === rangeTo) return nextTick(cb, null, Buffer.from(0))

    const tasks = targets.map(function (target) {
      return new Promise((resolve, reject) => {
        let from = target.from
        let to = target.to
        let offset = target.offset

        if (opts) {
          if (to > rangeTo) to = rangeTo
          if (from < rangeFrom) {
            offset += (rangeFrom - from)
            from = rangeFrom
          }
        }

        target.file.open(async function (err, file) {
          if (err) return reject(err)
          file.read(offset, to - from, (err, buffer) => {
            if (err) return reject(err)
            resolve(buffer)
          })
        })
      })
    })

    try {
      const buffers = await Promise.all(tasks)
      cb(null, Buffer.concat(buffers))
    } catch (err) {
      cb(err)
    }
  }
}

Storage.prototype.close = async function (cb) {
  const self = this
  if (self.closed) return nextTick(cb, new Error('Storage is closed'))
  self.closed = true

  const tasks = self.files.map(function (file) {
    return new Promise((resolve, reject) => {
      file.open(async function (err, file) {
        // an open error is okay because that means the file is not open
        if (err) return reject(null)
        // .destroy should be called separately when destroying a torrent, but
        // it's not so let's just destroy as soon as we close a file here.
        file.close(() => {
          file.destroy(resolve)
        })
      })
    })
  })
  try {
    await Promise.all(tasks)
    cb()
  } catch (err) {
    cb(err)
  }
}

Storage.prototype.destroy = function (cb) {
  const self = this
  self.close(async function () {
    const tasks = self.files.map(async function (file) {
      return new Promise(async (resolve) => {
        file.destroy(resolve)
      })
    })
    await Promise.all(tasks)
    cb()
  })
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}

function noop () {}
