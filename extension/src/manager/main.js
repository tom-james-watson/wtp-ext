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
    this.sync.bind(this)()
  }

  async sync() {
    const torrents = await browser.runtime.sendMessage({
      type: "get-all-torrents",
    })

    this.setState({
      loading: false,
      torrents
    })

    setTimeout(this.sync.bind(this), 2000)
  }

  render() {
    const {loading, torrents} = this.state

    if (loading) {
      return null
    }

    return (
      <React.Fragment>
        <h1>WebTorrent Manager</h1>
        <Torrents torrents={torrents} />
      </React.Fragment>
    )
  }
}
