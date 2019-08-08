import React from "react"
import PropTypes from 'prop-types'
import {Card, NonIdealState} from "@blueprintjs/core"
import Torrent from './torrent'

Torrents.propTypes = {
  torrents: PropTypes.array,
  toggleSeed: PropTypes.func,
  destroyTorrent: PropTypes.func
}

export default function Torrents({torrents, toggleSeed, destroyTorrent}) {
  return (
    <React.Fragment>
      {torrents.length === 0 && (
        <NonIdealState
          title="No torrents"
          description="Visit some WTP URLs"
        />
      )}
      {torrents.map((torrent) => {
        return (
          <Card className="torrent-card" key={torrent.infoHash}>
            <Torrent
              torrent={torrent}
              toggleSeed={toggleSeed}
              destroyTorrent={destroyTorrent}
            />
          </Card>
        )
      })}
    </React.Fragment>
  )
}
