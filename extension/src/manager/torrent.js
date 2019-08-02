import React from "react"
import PropTypes from 'prop-types'
import {Icon, ProgressBar, Button} from "@blueprintjs/core"
import prettyBytes from "pretty-bytes"

Torrent.propTypes = {
  torrent: PropTypes.object,
  browserAction: true
}

export default function Torrent({torrent, browserAction}) {
  if (!torrent) {
    return null
  }

  const peersIconIntent = torrent.numPeers > 0 ? "success" : "danger"

  const openTorrent = () => {
    // This is currently broken - https://github.com/mozilla/libdweb/issues/104
    browser.tabs.create({'url': `wtp://${torrent.infoHash}`})
  }

  const destroyTorrent = async () => {
    // Deal with returned `success` value - toast?
    await browser.runtime.sendMessage({
      type: "delete-torrent",
      hash: torrent.infoHash
    })
  }

  return (
    <React.Fragment>
      {!browserAction && (
        <div className="torrent-menu">
          <Button icon="trash" text="Delete" intent="danger" onClick={destroyTorrent} />
          <Button text="View" intent="primary" onClick={openTorrent} />
        </div>
      )}
      {torrent.infoHash === torrent.host ? (
        <p><strong>{torrent.infoHash}</strong></p>
      ) : (
        <React.Fragment>
          <p><strong>{torrent.host}</strong></p>
          <p className="meta">{torrent.infoHash}</p>
        </React.Fragment>
      )}
      <p className="meta">
        <Icon icon="exchange" id="peers-icon" intent={peersIconIntent} size="large" />
        Connected to {torrent.numPeers} peer{torrent.numPeers !== 1 && "s"}
      </p>
      <ProgressBar
        value={torrent.progress}
        intent="success"
        animate={torrent.progress < 1}
        stripes={torrent.progress < 1}
      />
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
