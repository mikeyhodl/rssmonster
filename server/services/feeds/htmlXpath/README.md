# HTML/XPath source adapter

This directory owns bounded conversion of server-rendered HTML into RSSMonster's
canonical `parsedFeed` contract. It does not persist feeds or articles.

`testHtmlXpathSource()` fetches the configured page through the guarded feed HTTP
layer, then sends the decoded body to a disposable parser worker. The worker uses
browser-style HTML recovery without script execution or external resource loading.
The item XPath is document-scoped. Field expressions are evaluated relative to each
matched item; content node sets preserve selected markup while scalar values become
text. Relative links and images use a valid document `<base>` or the effective fetched
URL.

Preview responses are bounded and presentation-safe. They never write validators,
aliases, feeds, crawl results, articles, or semantic jobs. Scheduled HTML/XPath feeds
should reuse this adapter and feed its canonical entries into the existing crawl
pipeline rather than adding scraper-specific article processing.
