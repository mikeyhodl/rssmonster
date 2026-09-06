import { load } from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import { normalizeFeedUrl } from '../feedManagement.js';
import { acquireHttp } from '../http/acquireHttp.js';
import { FETCH_OUTCOMES, isSuccessfulFetchOutcome } from '../http/contracts.js';
import { HTML_XPATH_LIMITS, htmlXpathError, normalizeHtmlXpathConfig } from './config.js';
import { parseHtmlXpathIsolated } from './isolatedHtmlXpathParser.js';

const PREVIEW_CONNECT_TIMEOUT_MS = 5000;
const PREVIEW_BODY_TIMEOUT_MS = 15000;

// Converts the parser result into a bounded presentation contract without returning raw DOM.
const previewResult = (result, effectiveUrl) => ({
  matchedItems: result.matchedItems,
  usableItems: result.usableItems,
  previewTruncated: result.previewTruncated,
  feed: {
    title: result.parsedFeed.title,
    description: result.parsedFeed.description,
    effectiveUrl
  },
  warnings: result.warnings.slice(0, 25),
  items: result.parsedFeed.entries.slice(0, HTML_XPATH_LIMITS.previewItems).map(entry => {
    const content = String(entry.content || '').slice(0, HTML_XPATH_LIMITS.previewContentCharacters);
    const contentHtml = entry.contentKind === 'html' ? sanitizeHtml(content) : null;
    const contentText = entry.contentKind === 'html'
      ? load(content).text().replace(/\s+/g, ' ').trim()
      : content.replace(/\s+/g, ' ').trim();
    return {
      title: entry.title,
      url: entry.url,
      publishedAt: entry.publishedAt,
      author: entry.author,
      contentHtml,
      contentText,
      imageUrl: entry.imageCandidates[0]?.url || null,
      externalId: entry.externalId
    };
  })
});

// Fetches and tests a webpage without persisting feed, crawl, alias, or article state.
export const testHtmlXpathSource = async ({ url: inputUrl, config }, {
  acquire = acquireHttp,
  parse = parseHtmlXpathIsolated
} = {}) => {
  const url = normalizeFeedUrl(inputUrl);
  const normalizedConfig = normalizeHtmlXpathConfig(config);
  const outcome = await acquire({
    url,
    headers: { accept: 'text/html,application/xhtml+xml;q=0.9' },
    retries: 0,
    connectTimeoutMs: PREVIEW_CONNECT_TIMEOUT_MS,
    bodyTimeoutMs: PREVIEW_BODY_TIMEOUT_MS
  });

  if (!isSuccessfulFetchOutcome(outcome)) {
    const error = htmlXpathError(
      outcome.error?.code || 'HTML_XPATH_FETCH_FAILED',
      outcome.error?.message || 'The website could not be fetched'
    );
    error.fetchOutcome = outcome;
    throw error;
  }
  if (outcome.type !== FETCH_OUTCOMES.CHANGED || !outcome.bodyText?.trim()) {
    throw htmlXpathError('HTML_XPATH_EMPTY_BODY', 'The website returned an empty body');
  }

  const effectiveUrl = outcome.response?.url || url;
  const result = await parse(outcome.bodyText, {
    url: effectiveUrl,
    config: normalizedConfig
  });
  return previewResult(result, effectiveUrl);
};

export default { testHtmlXpathSource };
