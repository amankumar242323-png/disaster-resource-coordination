# Network Analysis — geeksforgeeks.org

Captured live using Chrome DevTools → Network tab, "Disable cache" enabled,
full page reload.

- **Site tested:** https://www.geeksforgeeks.org
- **Date/time:** 8 September 2026

## Summary numbers

- **Total request count:** 203 requests
- **Total page size:** 16.8 MB transferred (24.5 MB uncompressed resources —
  the gap is gzip/br compression on the wire)
- **Total load time:** Finish: 5.93 s, DOMContentLoaded: ~545 ms

## Slowest single resource

Sorted the Network panel by the **Time** column, descending.

- **URL/Name:** `list/?count=true`
- **Type:** `fetch` (XHR-style call, not a document/script/image)
- **Initiator:** `_app-507b138313...` (a first-party app bundle triggering it)
- **Time:** 870 ms
- **Size:** 0.5 kB (transferred)
- **Likely reason it was slow:** despite the tiny payload, this is a
  server-side API call (`fetch`) — the delay is almost entirely
  **Time to First Byte** (server-side processing/analytics count lookup), not
  download size. A 0.5 kB response taking 870 ms is a strong signal the
  bottleneck is server response time, not network transfer.

Close behind it, several more `fetch`/analytics calls (`796001856/random...`,
`profile/`, `collect?...`) also clustered in the 200–750 ms range — the page
is making a chain of small third-party analytics/tracking requests that add
up, even though each individual payload is under a few KB.

## 3xx / 4xx responses seen

No 3xx or 4xx status codes were observed. All 203 requests returned either:
- `200 OK` — the overwhelming majority (scripts, images, stylesheets, fetches)
- `204 No Content` — several analytics/tracking calls
  (`collect?auid=...`, `collect?v=2&tid=G-D...`, `profile/`), which is
  expected behavior for "fire and forget" tracking pixels that don't need to
  return a body.

No redirects (3xx) and no client/server errors (4xx/5xx) were caught during
this load.

## Notes / observations

- A large share of the 203 requests are third-party **analytics/tracking**
  calls (Google Analytics-style `collect?`, `796001856/random...`, `profile/`
  calls repeated multiple times) rather than content the page actually needs
  to render — this is common on ad/analytics-heavy sites and inflates the
  request count significantly beyond what the visible page content would
  suggest.
- Many resources show `(disk cache)` as their size/time even with "Disable
  cache" ticked — these are typically resources served with
  `Cache-Control: immutable` or similar, which some browsers still serve from
  disk cache even when "Disable cache" is active for the current session (a
  known DevTools quirk, not a bug in the capture).
- The gap between "16.8 MB transferred" and "24.5 MB resources" shows
  compression is doing real work — roughly 32% size reduction on the wire.
- The single slowest item being a tiny 0.5 kB `fetch` (not a large image or
  script) is a good illustration that **resource size and load time are not
  the same thing** — server processing time and round-trip latency can matter
  more than payload size.