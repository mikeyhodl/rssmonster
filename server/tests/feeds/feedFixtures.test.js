import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseFeedSource } from '../../services/feeds/feedsmith/parseFeed.js';

const fixtureDirectory = new URL('../fixtures/feeds/', import.meta.url);
const { feeds: fixtures } = JSON.parse(readFileSync(new URL('manifest.json', fixtureDirectory), 'utf8'));

const parseFixture = file => {
  const fixture = fixtures.find(fixture => fixture.file === file);
  return parseFeedSource(readFileSync(new URL(file, fixtureDirectory), 'utf8'), {
    feedUrl: fixture.sourceUrl
  });
};

describe('captured publisher feed fixtures', () => {
  it.each(fixtures)('parses all $observedEntryCount entries in $file as $format', fixture => {
    const feed = parseFixture(fixture.file);

    expect(feed.format).toBe(fixture.format);
    expect(feed.entries).toHaveLength(fixture.observedEntryCount);
  });

  it('preserves Engadget descriptions, encoded bodies, categories, and image enclosures', () => {
    const feed = parseFixture('engadget-rss.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({
      title: 'Engadget - Technology News & Expert Reviews',
      description: 'Breaking news from the worlds of technology and entertainment, and expert reviews of the latest consumer tech products.'
    });
    expect(entry).toMatchObject({
      title: 'Is the Steam Deck still worth it in 2026?',
      url: 'https://www.engadget.com/2248094/is-steam-deck-still-worth-it/',
      externalId: 'https://www.engadget.com/2248094/is-steam-deck-still-worth-it/',
      externalIdType: 'guid',
      description: 'The Steam Deck is a solid gaming handheld, but after the arrival of several competitors and higher prices, is it still worth picking one up?',
      descriptionKind: 'html',
      contentKind: 'html',
      categories: ['PC Gaming'],
      publishedAt: '2026-09-05T22:30:00.000Z'
    });
    expect(entry.content).toBe(`${entry.description}<p><img src="https://www.engadget.com/img/gallery/is-the-steam-deck-still-worth-it-in-2026/intro-1788208373.jpg" /></p>`);
    expect(entry.imageCandidates).toContainEqual(expect.objectContaining({
      url: 'https://www.engadget.com/img/gallery/is-the-steam-deck-still-worth-it-in-2026/l-intro-1788208373.jpg',
      source: 'enclosure',
      mimeType: 'image/jpg'
    }));
  });

  it('preserves The Verge Atom identity, author, summary, and HTML body', () => {
    const feed = parseFixture('theverge-atom.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({ title: 'The Verge', selfUrl: 'https://www.theverge.com/rss/index.xml' });
    expect(entry).toMatchObject({
      title: 'Explore the globe in field recordings',
      url: 'https://www.theverge.com/tech/990873/earth-garden-globe-field-recordings',
      externalId: 'https://www.theverge.com/?p=990873',
      externalIdType: 'atom-id',
      author: 'Terrence O’Brien',
      descriptionKind: 'html',
      contentKind: 'html',
      categories: ['Apps', 'Column', 'Entertainment', 'Tech'],
      publishedAt: '2026-09-05T21:31:34.000Z',
      modifiedAt: '2026-09-05T21:31:34.000Z'
    });
    expect(entry.description).toBe("I love field recordings. I love making them. I love them when they're incorporated into my ambient music. They're great background noise for working or sleeping. But they're also great for active listening, focusing in on the fine nuances of burbling brooks or urban chaos. Earth Garden gives you a globe to explore with real [&#8230;]");
    expect(entry.content).toContain('<img alt="Earth Garden interactive field recording explorer."');
    expect(entry.content).toContain('<p class="wp-block-paragraph">I love field recordings.');
  });

  it('preserves Ars Technica Dublin Core authors and Media RSS image dimensions', () => {
    const feed = parseFixture('arstechnica-rss.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({ title: 'Ars Technica - All content', description: 'All Ars Technica stories' });
    expect(entry).toMatchObject({
      title: 'Tesla’s Cybercab has been deployed, and it’s already under investigation',
      url: 'https://arstechnica.com/cars/2026/09/teslas-cybercab-has-been-deployed-and-its-already-under-investigation/',
      externalId: 'https://arstechnica.com/cars/2026/09/teslas-cybercab-has-been-deployed-and-its-already-under-investigation/',
      externalIdType: 'guid',
      author: 'Aarian Marshall, WIRED.COM',
      description: 'The US government is investigating whether the Cybercab meets vehicle safety standards.',
      descriptionKind: 'html',
      contentKind: 'html',
      publishedAt: '2026-09-05T15:17:36.000Z'
    });
    expect(entry.content).toContain('<p>Tesla’s Cybercab, a distinctive two-seater without a steering wheel or brake pedals,');
    expect(entry.imageCandidates).toContainEqual(expect.objectContaining({
      url: 'https://cdn.arstechnica.net/wp-content/uploads/2025/05/GettyImages-2183782392-1152x648.jpg',
      source: 'media-content',
      mimeType: 'image/jpeg',
      width: 1152,
      height: 648
    }));
  });

  it('keeps xkcd summary-only comics and updated-only dates distinct from body and publication', () => {
    const feed = parseFixture('xkcd-atom.xml');
    const entry = feed.entries[0];

    expect(feed.title).toBe('xkcd.com');
    expect(entry).toMatchObject({
      title: 'Asteroid Mission',
      url: 'https://xkcd.com/3294/',
      externalId: 'https://xkcd.com/3294/',
      externalIdType: 'atom-id',
      descriptionKind: 'html',
      content: null,
      contentKind: null,
      publishedAt: null,
      modifiedAt: '2026-09-04T00:00:00.000Z'
    });
    const altText = "Lander, this is Houston. There's been a request that you turn clipping back on and instead set the mass to 1kg. The theorists believe that will be pretty funny.";
    expect(entry.description).toBe(`<img src="https://imgs.xkcd.com/comics/asteroid_mission.png" title="${altText}" alt="${altText}" />`);
  });

  it('keeps Hacker News discussion identity separate from the linked article', () => {
    const feed = parseFixture('hnrss-newest-rss.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({ title: 'Hacker News: Newest', description: 'Hacker News RSS' });
    expect(entry).toMatchObject({
      title: 'New all in one 6502 computer (Neo6502)',
      url: 'https://olimex.wordpress.com/2026/09/04/new-open-source-hardware-variant-of-neo6502-now-includes-keyboard-4-usb-hosts-uext-power-switch-and-usb-c-for-power-and-programming-all-in-one-keyboard-body/',
      externalId: 'https://news.ycombinator.com/item?id=49585605',
      externalIdType: 'guid',
      author: 'AlexeyBrin',
      descriptionKind: 'html',
      content: null,
      contentKind: null,
      publishedAt: '2026-09-06T11:51:28.000Z'
    });
    expect(entry.description).toContain(`<p>Article URL: <a href="${entry.url}">${entry.url}</a></p>`);
    expect(entry.description).toContain('<p>Comments URL: <a href="https://news.ycombinator.com/item?id=49585605">https://news.ycombinator.com/item?id=49585605</a></p>');
    expect(entry.description).toContain('<p>Points: 1</p>\n<p># Comments: 0</p>');
  });

  it('preserves WordPress summaries separately from full HTML and opaque GUIDs', () => {
    const feed = parseFixture('wordpress-com-rss.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({ title: 'WordPress.com Blog', description: 'News, Tips & Website Tutorials' });
    expect(entry).toMatchObject({
      title: 'WordPress.com Changelog: A New Hosting Dashboard, a ChatGPT Plugin, and WordPress 7.1',
      url: 'https://wordpress.com/blog/2026/08/28/changelog-hosting-dashboard-chatgpt/',
      externalId: 'http://en.blog.wordpress.com/?p=86961',
      externalIdType: 'guid',
      author: 'WordPress.com Staff',
      description: 'WordPress.com’s latest updates include a redesigned Hosting Dashboard, a new ChatGPT plugin, WordPress 7.1, and practical improvements for users.',
      descriptionKind: 'html',
      contentKind: 'html',
      categories: ['Changelog', 'AI Tools', 'MCP', 'WordPress Core'],
      publishedAt: '2026-08-28T20:00:00.000Z'
    });
    expect(entry.content).toContain('<p class="wp-block-paragraph"><em>August 14 – 27, 2026</em></p>');
    expect(entry.content).toContain('<h2 class="wp-block-heading">The Hosting Dashboard for your site management needs</h2>');
  });

  it('preserves Reddit HTML content, author, subreddit, and stable post identity', () => {
    const feed = parseFixture('reddit-atom.xml');
    const entry = feed.entries[0];

    expect(feed).toMatchObject({
      title: 'reddit: the front page of the internet',
      selfUrl: 'https://www.reddit.com/.rss'
    });
    expect(entry).toMatchObject({
      title: 'After 457 Years, the UN Approves a New World Map to Show Africa’s True Size',
      url: 'https://www.reddit.com/r/interesting/comments/1w85n39/after_457_years_the_un_approves_a_new_world_map/',
      externalId: 't3_1w85n39',
      externalIdType: 'atom-id',
      author: '/u/General_Athlete5807',
      categories: ['interesting'],
      description: null,
      descriptionKind: null,
      contentKind: 'html',
      publishedAt: '2026-09-05T16:41:42.000Z',
      modifiedAt: '2026-09-05T16:41:42.000Z'
    });
    expect(entry.content).toContain('<table> <tr><td> <a href="https://www.reddit.com/r/interesting/comments/1w85n39/after_457_years_the_un_approves_a_new_world_map/">');
    expect(entry.content).toContain('<a href="https://www.reddit.com/user/General_Athlete5807"> /u/General_Athlete5807 </a>');
  });
});
