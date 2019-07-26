import React from "react"
import {NonIdealState, Icon, ProgressBar, Divider} from "@blueprintjs/core"
import prettyBytes from "pretty-bytes"

export default function Others({torrents}) {
  console.log('Others', {torrents})

  return (
    <React.Fragment>
      {torrents.length === 0 && (
        <NonIdealState
          title="No other torrents"
          description="Visit some WTP URLs"
        />
      )}
      {torrents.length > 0 && (
        <React.Fragment>
          <h4 className="meta">Other Torrents</h4>
          {torrents.map((torrent, index) => {
            const peersIconIntent = torrent.numPeers > 0 ? "success" : "danger"
            console.log({torrent, peersIconIntent})

            return (
              <React.Fragment key={torrent.infoHash}>
                <p>{torrent.infoHash}</p>
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
                  {prettyBytes(torrent.downloaded)} ({prettyBytes(torrent.downloadSpeed)}/s)
                </p>
                {index < torrents.length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )}
    </React.Fragment>
  )
}
