import React from "react"
import Current from "./current"
import Others from "./others"

export default class Main extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true,
      currentTorrent: null,
      otherTorrents: null
    }
  }

  componentDidMount() {
    this.sync.bind(this)()
  }

  async sync() {
    const {loading} = this.state

    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]

    const {currentTorrent, otherTorrents} = await browser.runtime.sendMessage({
      type: "get-torrent-statuses",
      url: tab.url
    })

    this.setState({
      loading: false,
      currentTorrent,
      otherTorrents
    })

    setTimeout(this.sync.bind(this), currentTorrent && currentTorrent.progress < 1 ? 500 : 2000)
  }

  render() {
    const {loading, currentTorrent, otherTorrents} = this.state

    console.log('Main', {loading, currentTorrent, otherTorrents})

    if (loading) {
      return null
    }

    return (
      <React.Fragment>
        <Current torrent={currentTorrent} />
        {(otherTorrents.length > 0 || !currentTorrent) && (
          <Others torrents={otherTorrents} />
        )}
      </React.Fragment>
    )
  }
}
