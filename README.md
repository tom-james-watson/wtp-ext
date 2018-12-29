WebTorrent Protocol
===================

Proof-of-concept distributed web powered by WebTorrents.

---

This repository contains a web extension that, using [libdweb](https://github.com/mozilla/libdweb/), registers a protocol handler for a new `wtp://` WebTorrent Protocol. This extension allows you to open wtp links as fully-functioning webpages, loaded directly from torrents.

## How WTP works

The extension registers itself as a handler for the `wtp://` protocol, meaning requests to `wtp://` resources are intercepted and handled by the extension.

WTP URLs have the following structure:

`wtp://<magnet hash>[/path to resource]`

For example, here is a link to a blog post on my personal website:

[wtp://b8bede038ff70c6e683e5b18f650f17deb1ed532/blog/vim-tips/](wtp://b8bede038ff70c6e683e5b18f650f17deb1ed532/blog/vim-tips/)

The extension will parse the magnet hash of the resource and load the torrent using the [WebTorrent](https://github.com/webtorrent/webtorrent) library. Requests to resources are then translated directly into lookups for files in the loaded torrent. Requests to paths without file extensions will be assumed to be requests for a `index.html` file in a folder at the given path, e.g. `/blog` will look for a `/blog/index.html` file.

## Roadmap

Here are the major pieces of functionality I would like to add:

* Use DNS TXT record lookups to allow resolving of domains to hashes.
* Have the extension display some indication of the state of the torrent when loading a WTP resource, such as number of seeders.
* Add the ability to create and seed websites directly from the extension.

## Running the WebTorrent Protocol Handler extension

### Prerequisites

The extension depends on the experimental APIs provided by [libdweb](https://github.com/mozilla/libdweb/) and as such must be run using [Firefox Nightly](https://www.mozilla.org/en-US/firefox/nightly/all/?q=English%20(US)).

### Running

Install dependencies:

```
npm install
```

Bundle the extension's JavaScript:

```
npm run bundle
```

Launch Firefox Nightly with the extension loaded as a temporary addon:

```
npm start
```

### Running directly on Firefox Nightly

Alternatively, if you don't want to clone the whole repo, you can load the built extension as a temporary addon in Firefox Nightly.

*NOTE - you must launch Firefox Nightly with the content sandbox disabled*:

```
MOZ_DISABLE_CONTENT_SANDBOX=1 /path/to/firefox-nightly
```

On macOS, the bin is located at:

```
/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox-bin
```

You can then load the temporary addon by going to [about:debugging#addons](about:debugging#addons) and selecting <link to be added>.

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
