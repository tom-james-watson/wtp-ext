import React from "react"
import PropTypes from 'prop-types'
import {Icon, ProgressBar} from "@blueprintjs/core"
import prettyBytes from "pretty-bytes"

Torrent.propTypes = {
  torrent: PropTypes.object
}

export default function Torrent({torrent}) {
  if (!torrent) {
    return null
  }

  const peersIconIntent = torrent.numPeers > 0 ? "success" : "danger"

  //
  // const openTorrent = () => {
  //   browser.tabs.create({'url': `wtp://${torrent.infoHash}`})
  // }

  return (
    <React.Fragment>
      <p><strong>{torrent.infoHash}</strong></p>
      <p className="meta">
        <Icon icon="exchange" id="peers-icon" intent={peersIconIntent} size="large" />
        Connected to {torrent.numPeers} peer{torrent.numPeers !== 1 && "s"}
      </p>
      <p>
        <ProgressBar
          value={torrent.progress}
          intent="success"
          animate={torrent.progress < 1}
          stripes={torrent.progress < 1}
        />
      </p>
      <p className="meta">
        <Icon icon="upload" id="upload-icon" size="large" />
        {prettyBytes(torrent.uploaded)} ({prettyBytes(torrent.uploadSpeed)}/s)
        <Icon icon="download" id="download-icon" size="large" />
        {prettyBytes(torrent.downloaded)}
        &nbsp;
        {torrent.progress < 1 && (
          <React.Fragment>
            ({prettyBytes(torrent.downloadSpeed)}/s)
          </React.Fragment>
        )}
      </p>
    </React.Fragment>
  )
}
