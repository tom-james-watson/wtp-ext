import thunky from 'thunky'

let VOLUME_URL = null

async function init() {
  const url = localStorage.getItem("volumeURL")
  const volume = await browser.FileSystem.mount({url, read: true, write: true})
  VOLUME_URL = volume.url
  localStorage.setItem("volumeURL", VOLUME_URL)
}
init()

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
      const pathParts = file.path.split('/').slice(2)

      // mkdirp
      for (let i = 1; i < pathParts.length; i++) {
        await browser.FileSystem.createDirectory(
          new URL(`./${pathParts.slice(0, i).join('/')}`, VOLUME_URL).href
        )
      }

      const fileURL = new URL(`./${pathParts.join('/')}`, VOLUME_URL).href
      const f = await browser.FileSystem.open(fileURL, {
        read: true,
        write: true,
      })
      f.url = fileURL
      cb(null, f)
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
      await browser.File.write(file, buf.buffer, {position: index * self.chunkLength})
      cb()
    })
  } else {
    const targets = self.chunkMap[index]
    if (!targets) return nextTick(cb, new Error('no files matching the request range'))
    const tasks = targets.map(function (target) {
      return new Promise((resolve, reject) => {
        target.file.open(async function (err, file) {
          if (err) return reject(err)
          await browser.File.write(file, buf.slice(target.from, target.to).buffer, {position: target.offset, size: target.to - target.from})
          resolve()
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
      const chunk = await browser.File.read(file, {position: offset, size: rangeTo - rangeFrom})
      cb(chunk)
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
          const chunk = await browser.File.read(file, {position: offset, size: to - from})
          resolve(new Buffer(chunk))
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
        await browser.File.close(file)
        resolve()
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
        await browser.File.removeFile(file, {ignoreAbsent: true})
        resolve()
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
