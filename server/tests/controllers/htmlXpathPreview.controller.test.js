import { beforeEach, describe, expect, it, vi } from 'vitest';

const testHtmlXpathSource = vi.hoisted(() => vi.fn());

vi.mock('../../services/feeds/htmlXpath/testHtmlXpathSource.js', () => ({
  testHtmlXpathSource
}));

const controller = (await import('../../controllers/feed.js')).default;

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe('HTML/XPath preview controller', () => {
  it('returns a non-persistent adapter preview for an authenticated user', async () => {
    const preview = { matchedItems: 1, usableItems: 1, items: [{ title: 'Story' }] };
    testHtmlXpathSource.mockResolvedValue(preview);
    const res = response();

    await controller.testHtmlXpathFeed({
      userData: { userId: 42 },
      body: {
        url: 'https://example.com/',
        sourceType: 'html_xpath',
        sourceConfig: { item: '//article', itemTitle: './/h2' }
      }
    }, res);

    expect(testHtmlXpathSource).toHaveBeenCalledWith({
      url: 'https://example.com/',
      config: { item: '//article', itemTitle: './/h2' }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(preview);
  });

  it.each([
    ['HTML_XPATH_INVALID_EXPRESSION', null, 400],
    ['HTML_XPATH_NO_ITEMS', null, 422],
    ['HTML_XPATH_TOO_MANY_ITEMS', null, 413],
    ['SSRF_BLOCKED', 'security_rejected', 403],
    ['REQUEST_TIMEOUT', 'timed_out', 504]
  ])('maps %s failures to HTTP %i', async (code, outcomeType, status) => {
    const error = Object.assign(new Error('Preview failed'), { code });
    if (outcomeType) error.fetchOutcome = { type: outcomeType };
    testHtmlXpathSource.mockRejectedValue(error);
    const res = response();

    await controller.testHtmlXpathFeed({
      userData: { userId: 42 },
      body: { sourceType: 'html_xpath', sourceConfig: {}, url: 'https://example.com/' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code }));
  });
});
