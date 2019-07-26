import React from "react"
import PropTypes from 'prop-types'
import {Card, NonIdealState} from "@blueprintjs/core"
import Torrent from './torrent'

Torrents.propTypes = {
  torrents: PropTypes.object
}

export default function Torrents({torrents}) {
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
            <Torrent torrent={torrent} />
          </Card>
        )
      })}
    </React.Fragment>
  )
}
