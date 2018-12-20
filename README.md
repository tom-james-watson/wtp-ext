WebTorrent Protocol
===================

Proof-of-concept distributed web powered by WebTorrents.

---

This repository contains a web extension that, using [libdweb](https://github.com/mozilla/libdweb/), registers a protocol handler for a new `wtp://` WebTorrent Protocol. This extension allows you to open magnet links as fully-functioning webpages. Requests to resources are resolved directly from the torrent itself.

More information will be added soon.

### Development

Install dependencies:

```
npm i
```

Run webpack to create the extension JS bundle:

```
npm run watch
```

Open the web extension in a sandboxed Firefox Nightly instance:

```
npm start
```
