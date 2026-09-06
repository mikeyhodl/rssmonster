import { describe, expect, it, vi } from 'vitest';

import { acquireHtmlXpathFeed } from '../../services/feeds/htmlXpath/acquireHtmlXpathFeed.js';

const FEED = {
  id: 9,
  feedType: 'html_xpath',
  sourceConfig: {
    item: '//article',
    itemTitle: './/h2',
    itemUri: './/a/@href'
  },
  etag: '"page-v2"',
  lastModified: 'Fri, 04 Sep 2026 08:00:00 GMT',
  contentHash: 'old-page-hash'
};

describe('HTML/XPath crawl acquisition', () => {
  it('uses validators and parses changed HTML at its effective URL', async () => {
    const acquire = vi.fn().mockResolvedValue({
      type: 'changed',
      attempts: 1,
      response: { url: 'https://www.example.com/news' },
      policy: { etag: '"page-v3"' },
      bodyHash: 'new-page-hash',
      bodyText: '<article><h2>Headline</h2></article>'
    });
    const parsedFeed = {
      format: 'html_xpath',
      title: 'News',
      entries: [{ title: 'Headline' }]
    };
    const parse = vi.fn().mockResolvedValue({ parsedFeed });
    const signal = new AbortController().signal;
    const deadlineAt = Date.now() + 10_000;

    await expect(acquireHtmlXpathFeed({
      url: 'https://example.com/news',
      feed: FEED,
      execution: { signal, deadlineAt }
    }, { acquire, parse })).resolves.toMatchObject({
      type: 'changed',
      url: 'https://www.example.com/news',
      feed: FEED,
      bodyHash: 'new-page-hash',
      parsedFeed
    });
    expect(acquire).toHaveBeenCalledWith({
      url: 'https://example.com/news',
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9',
        'if-none-match': '"page-v2"',
        'if-modified-since': 'Fri, 04 Sep 2026 08:00:00 GMT'
      },
      previousContentHash: 'old-page-hash',
      deadlineAt,
      signal
    });
    expect(parse).toHaveBeenCalledWith(
      '<article><h2>Headline</h2></article>',
      {
        url: 'https://www.example.com/news',
        config: expect.objectContaining(FEED.sourceConfig)
      },
      { deadlineAt, signal }
    );
  });

  it.each(['unchanged', 'not_modified'])(
    'passes %s through without running XPath extraction',
    async type => {
      const acquire = vi.fn().mockResolvedValue({ type, attempts: 1 });
      const parse = vi.fn();

      await expect(acquireHtmlXpathFeed({
        url: 'https://example.com/news',
        feed: FEED
      }, { acquire, parse })).resolves.toMatchObject({
        type,
        url: 'https://example.com/news',
        feed: FEED
      });
      expect(parse).not.toHaveBeenCalled();
    }
  );

  it('classifies invalid saved XPath and extraction failures as malformed', async () => {
    const acquire = vi.fn();
    await expect(acquireHtmlXpathFeed({
      url: 'https://example.com/news',
      feed: { ...FEED, sourceConfig: null }
    }, { acquire })).resolves.toMatchObject({
      type: 'malformed',
      error: { code: 'HTML_XPATH_INVALID_CONFIG' },
      attempts: 0
    });
    expect(acquire).not.toHaveBeenCalled();

    const parse = vi.fn().mockRejectedValue(Object.assign(
      new Error('The item XPath did not match any elements'),
      { name: 'HtmlXpathError', code: 'HTML_XPATH_NO_ITEMS' }
    ));
    await expect(acquireHtmlXpathFeed({
      url: 'https://example.com/news',
      feed: FEED
    }, {
      acquire: vi.fn().mockResolvedValue({
        type: 'changed',
        attempts: 1,
        bodyText: '<main>No articles today</main>'
      }),
      parse
    })).resolves.toMatchObject({
      type: 'malformed',
      error: { code: 'HTML_XPATH_NO_ITEMS' }
    });
  });
});
