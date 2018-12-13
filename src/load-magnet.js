console.log('Loaded JavaScript.')

const magnetUrl = 'magnet' + decodeURIComponent(document.location.hash.substr(6)) + '&tr=udp://explodie.org:6969&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://tracker.empire-js.us:1337&tr=udp://tracker.leechers-paradise.org:6969&tr=udp://tracker.opentrackr.org:1337&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.fastcast.nz&tr=wss://tracker.openwebtorrent.com'

// const magnetUrl = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'

var client = new WebTorrent()

console.log('Adding', {magnetUrl})

client.add(magnetUrl, function (torrent) {
  console.log({torrent})

  // Torrents can contain many files. Let's use the .mp4 file
  var file = torrent.files.find(function (file) {
    console.log({file})
    return file.name === 'index.html'
  })

  function listener(details) {
    if (details.url.indexOf('https://dweb.dev') === -1) {
      return
    }

    const urlPath = details.url.replace('https://dweb.dev', '')

    const file = torrent.files.find(function (file) {
      const filePath = file.path.replace('Assets', '')
      if (filePath === urlPath) {
        return true
      }
    })
    console.log('found', {file})

    let filter = browser.webRequest.filterResponseData(details.requestId)

    const fileStream = file.createReadStream()

    // var bufs = [];
    fileStream.on('data', function(d) {
      console.log('on file data', {d})
      // var buf = Uint8Array.concat(bufs)
      filter.write(d.buffer)
      // bufs.push(d)
    })
    fileStream.on('end', function() {
      console.log('on file end')
      filter.disconnect()
    })


  }

  browser.webRequest.onBeforeRequest.addListener(
    listener,
    {
      urls: [
        "<all_urls>"
      ],
      types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    },
    ["blocking"]
  )

  var opts = {
    method: 'GET',
    headers: {}
  }
  fetch('https://www.reddit.com', opts).then(function (response) {
    return response.json()
  })
    .then(function (body) {
      console.log({body})
      // doSomething with body;
    })

  file.renderTo('#container')
})
