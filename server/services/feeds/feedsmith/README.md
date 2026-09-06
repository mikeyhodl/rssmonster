# Feedsmith adapter

This directory is the only production boundary that understands Feedsmith output shapes.

`parseFeed.js` exposes the public parsing operations. Parsed data is converted immediately into
RSSMonster-owned canonical feed and entry objects before it reaches controllers or crawl services.

The canonical feed contract contains:

- `format`
- `title`
- `description`
- `faviconUrl`
- `publishedAt`
- `selfUrl`
- `entries`

Each canonical entry contains:

- `title`
- `url`
- `description`
- `content`
- `author`
- `categories`
- `publishedAt`
- `modifiedAt`
- `externalId`
- `externalIdType`
- `media`
- `imageCandidates`

Code outside this directory must consume these canonical fields and must not inspect Feedsmith
namespaces or container shapes directly.

Favicons use the first usable HTTP(S) URL from `favicon`, `icon`, `logo`, then
`image`. Relative URLs resolve against the feed's XML base or fetched URL, with
the publisher site as a fallback when fetch provenance is unavailable. Candidates
must fit the stored URL column. Successful changed-feed crawls replace the stored
icon when one is supplied and retain it when no usable candidate exists. Unchanged
responses retain the icon without reparsing. Publisher HTML icon discovery is not
performed.
