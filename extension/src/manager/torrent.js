import React from "react"
import PropTypes from 'prop-types'
import {Icon, ProgressBar, Button, Switch} from "@blueprintjs/core"
import prettyBytes from "pretty-bytes"

Torrent.propTypes = {
  torrent: PropTypes.object,
  browserAction: PropTypes.bool,
  toggleSeed: PropTypes.func,
  destroyTorrent: PropTypes.func
}

export default function Torrent({torrent, browserAction, toggleSeed, destroyTorrent}) {
  if (!torrent) {
    return null
  }

  const peersIconIntent = torrent.numPeers > 0 ? "success" : "danger"

  const openTorrent = () => {
    // This is currently broken - https://github.com/mozilla/libdweb/issues/104
    browser.tabs.create({'url': `wtp://${torrent.infoHash}`})
  }

  return (
    <React.Fragment>
      {!browserAction && (
        <div className="torrent-menu">
          <Button icon="trash" text="Delete" intent="danger" onClick={() => destroyTorrent(torrent)} />
          <Button text="View" intent="primary" onClick={openTorrent} />
        </div>
      )}
      {torrent.infoHash === torrent.host ? (
        <div className="torrent-section"><strong>{torrent.infoHash}</strong></div>
      ) : (
        <React.Fragment>
          <div className="torrent-section"><strong>{torrent.host}</strong></div>
          <div className="torrent-section meta">{torrent.infoHash}</div>
        </React.Fragment>
      )}
      <div className="torrent-section meta">
        <Icon icon="exchange" id="peers-icon" intent={peersIconIntent} size="large" />
        Connected to {torrent.numPeers} peer{torrent.numPeers !== 1 && "s"}
      </div>
      <ProgressBar
        value={torrent.progress}
        intent="success"
        animate={torrent.progress < 1}
        stripes={torrent.progress < 1}
      />
      <div className="torrent-section meta">
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
      </div>
      <div className="torrent-section meta">
        <Switch checked={torrent.seed} label="Permanently seed site" onChange={() => toggleSeed(torrent)} />
      </div>
    </React.Fragment>
  )
}
