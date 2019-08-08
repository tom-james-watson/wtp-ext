import React from "react"
import Torrents from "./torrents"

export default class Main extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true,
      torrents: []
    }
  }

  componentDidMount() {
    this.sync = this.sync.bind(this)
    setInterval(this.sync, 2000)
    this.sync()
  }

  async sync() {
    const torrents = await browser.runtime.sendMessage({
      type: "get-all-torrents",
    })

    this.setState({
      loading: false,
      torrents
    })
  }

  async toggleSeed(torrent) {
    await browser.runtime.sendMessage({
      type: "toggle-seed-torrent",
      hash: torrent.infoHash,
      seed: !torrent.seed
    })

    await this.sync()
  }

  async destroyTorrent(torrent) {
    // Deal with returned `success` value - toast?
    await browser.runtime.sendMessage({
      type: "delete-torrent",
      hash: torrent.infoHash
    })

    await this.sync()
  }

  render() {
    const {loading, torrents} = this.state

    if (loading) {
      return null
    }

    return (
      <React.Fragment>
        <h1>WebTorrent Manager</h1>
        <Torrents
          torrents={torrents}
          toggleSeed={this.toggleSeed.bind(this)}
          destroyTorrent={this.destroyTorrent.bind(this)}
        />
      </React.Fragment>
    )
  }
}
