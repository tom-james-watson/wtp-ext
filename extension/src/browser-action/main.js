import React from "react"
import {ButtonGroup, Button} from "@blueprintjs/core"
import Torrent from "../manager/torrent"

export default class Main extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true,
      torrent: null
    }
  }

  componentDidMount() {
    this.sync = this.sync.bind(this)
    setInterval(this.sync, 500)
    this.sync()
  }

  async sync() {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]

    const torrent = await browser.runtime.sendMessage({
      type: "get-current-torrent",
      url: tab.url
    })

    this.setState({
      loading: false,
      torrent
    })
  }

  openManager() {
    browser.tabs.create({'url': browser.extension.getURL('/views/manager.html')})
  }

  async toggleSeed() {
    const {torrent} = this.state

    await browser.runtime.sendMessage({
      type: "toggle-seed-torrent",
      hash: torrent.infoHash,
      seed: !torrent.seed
    })

    await this.sync()
  }

  render() {
    const {loading, torrent} = this.state

    if (loading) {
      return null
    }

    return (
      <React.Fragment>
        <Torrent torrent={torrent} browserAction toggleSeed={this.toggleSeed.bind(this)}/>
        {!torrent && (
          <React.Fragment>
            <h4>WebTorrent Protocol</h4>
          </React.Fragment>
        )}
        <ButtonGroup>
          <Button intent="primary" onClick={this.openManager} id="manage-webtorrents">
            Manage WebTorrents
          </Button>
        </ButtonGroup>
      </React.Fragment>
    )
  }
}
