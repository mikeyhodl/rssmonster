import { describe, expect, it, vi } from 'vitest';

import { createFetchOutcome, createHttpResponse, FETCH_OUTCOMES } from '../../services/feeds/http/contracts.js';
import { testHtmlXpathSource } from '../../services/feeds/htmlXpath/testHtmlXpathSource.js';

const config = { item: '//article', itemTitle: './/h2', itemUri: './/a/@href' };

describe('HTML/XPath preview service', () => {
  it('uses guarded acquisition and returns a bounded presentation result', async () => {
    const acquire = vi.fn().mockResolvedValue(createFetchOutcome(FETCH_OUTCOMES.CHANGED, {
      bodyText: '<title>News</title><meta name="description" content="Publisher updates"><article><h2>Story</h2><a href="/story">Read</a></article>',
      response: createHttpResponse({ status: 200, url: 'https://example.com/final' })
    }));

    const preview = await testHtmlXpathSource({
      url: 'https://example.com/start',
      config
    }, { acquire });

    expect(acquire).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/start',
      retries: 0,
      headers: { accept: 'text/html,application/xhtml+xml;q=0.9' }
    }));
    expect(preview).toMatchObject({
      matchedItems: 1,
      usableItems: 1,
      feed: {
        title: 'News',
        description: 'Publisher updates',
        effectiveUrl: 'https://example.com/final'
      },
      items: [{ title: 'Story', url: 'https://example.com/story' }]
    });
  });

  it('preserves guarded fetch classification on preview failures', async () => {
    const acquire = vi.fn().mockResolvedValue(createFetchOutcome(FETCH_OUTCOMES.SECURITY_REJECTED, {
      error: { type: FETCH_OUTCOMES.SECURITY_REJECTED, code: 'SSRF_BLOCKED', message: 'Blocked' }
    }));

    await expect(testHtmlXpathSource({
      url: 'https://example.com/',
      config
    }, { acquire })).rejects.toMatchObject({
      code: 'SSRF_BLOCKED',
      fetchOutcome: { type: FETCH_OUTCOMES.SECURITY_REJECTED }
    });
  });
});
