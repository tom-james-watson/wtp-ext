import React from "react"
import {Icon, ProgressBar} from "@blueprintjs/core"
import prettyBytes from "pretty-bytes"

export default function Current({torrent}) {
  console.log('Current', {torrent})

  if (!torrent) {
    return null
  }

  const peersIconIntent = torrent.numPeers > 0 ? "success" : "danger"

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
        {prettyBytes(torrent.uploaded)}
        ({prettyBytes(torrent.uploadSpeed)}/s)
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
