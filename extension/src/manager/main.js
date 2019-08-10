import React from "react"
import Torrents from "./torrents"
import NonIdealState from "./non-ideal-state"

export default class Main extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true,
      seededTorrents: [],
      cachedTorrents: []
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

    const seededTorrents = torrents.filter((torrent) => {
      return torrent.seed === true
    })

    const cachedTorrents = torrents.filter((torrent) => {
      return torrent.seed === false
    })

    this.setState({
      loading: false,
      seededTorrents,
      cachedTorrents
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
    const {loading, seededTorrents, cachedTorrents} = this.state

    if (loading) {
      return null
    }

    return (
      <React.Fragment>
        <h1>
          <img src="/logo.svg" id="logo" />
          WebTorrent Protocol
        </h1>
        {seededTorrents.length === 0 && cachedTorrents.length === 0 && (
          <NonIdealState
            title="No torrents"
            description="Visit some WTP URLs"
          />
        )}
        {(seededTorrents.length > 0 || cachedTorrents.length > 0) && (
          <React.Fragment>
            <h3>Seeded Sites</h3>
            {seededTorrents.length === 0 && cachedTorrents.length > 0 && (
              <NonIdealState
                title="No sites being seeded"
                description='Select "Permanently seed site" to start seeding a site'
              />
            )}
            <Torrents
              torrents={seededTorrents}
              toggleSeed={this.toggleSeed.bind(this)}
              destroyTorrent={this.destroyTorrent.bind(this)}
            />
            <h3>Cached Sites</h3>
            {seededTorrents.length > 0 && cachedTorrents.length === 0 && (
              <NonIdealState
                title="No sites currently cached"
                description="Visit some more WTP URLs"
              />
            )}
            <Torrents
              torrents={cachedTorrents}
              toggleSeed={this.toggleSeed.bind(this)}
              destroyTorrent={this.destroyTorrent.bind(this)}
            />
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}
