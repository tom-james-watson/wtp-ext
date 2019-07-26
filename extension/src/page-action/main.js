import React from 'react'
import {Spinner, Icon, ProgressBar, Divider} from "@blueprintjs/core"
import prettyBytes from 'pretty-bytes'

export default class Main extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true,
      progressEnded: false,
      torrent: null
    }
  }

  async sync() {
    const {loading, progressEnded} = this.state

    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]

    const torrent = await browser.runtime.sendMessage({
      type: 'get-torrent-details',
      url: tab.url
    })

    if (torrent && torrent.progress === 1 && !progressEnded) {
      if (loading) {
        this.setState({progressEnded: true})
      } else {
        setTimeout(() => {
          this.setState({progressEnded: true})
        }, 3000)
      }
    }

    this.setState({
      loading: false,
      torrent
    })

    setTimeout(this.sync.bind(this), progressEnded ? 2000 : 500)
  }

  componentDidMount() {
    this.sync.bind(this)()
  }

  render() {
    const {loading, torrent, progressEnded} = this.state

    if (loading) {
      return <Spinner id="spinner"/>
    }

    // timeRemaining: torrent.timeRemaining,
    // downloaded: torrent.downloaded,
    // received: torrent.received,
    // uploaded: torrent.uploaded,
    // downloadSpeed: torrent.downloadSpeed,
    // uploadSpeed: torrent.uploadSpeed,
    // progress: torrent.progress,
    // ratio: torrent.ratio,
    // path: torrent.path,
    // infoHash: torrent.infoHash,
    // numPeers: torrent.numPeers,

    const peersIconIntent = torrent.numPeers > 0 ? 'success' : 'danger'

    return (
      <React.Fragment>
        <p><strong>{torrent.infoHash}</strong></p>
        <Divider />
        <p className="meta">
          <Icon icon="exchange" id="peers-icon" intent={peersIconIntent} size="large" />
          Connected to {torrent.numPeers} peer{torrent.numPeers !== 1 && 's'}
        </p>
        {!progressEnded && (
          <p>
            <ProgressBar value={torrent.progress} intent="success" />
          </p>
        )}
        <p className="meta">
          <Icon icon="upload" id="upload-icon" size="large" />
          {prettyBytes(torrent.uploaded)}
          ({prettyBytes(torrent.uploadSpeed)}/s)
          <Icon icon="download" id="download-icon" size="large" />
          {prettyBytes(torrent.received)}
          {torrent.progress < 1 && (
            <React.Fragment>
              ({prettyBytes(torrent.downloadSpeed)}/s)
            </React.Fragment>
          )}
        </p>
      </React.Fragment>
    )
  }
}
