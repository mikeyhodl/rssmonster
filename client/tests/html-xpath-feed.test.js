import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import HtmlXpathFeed from '../src/components/dialogs/feeds/HtmlXpathFeed.vue';
import { testHtmlXpathSource } from '../src/api/feeds.js';
import { createFocusedStores } from './helpers/focusedStores.js';

vi.mock('../src/api/feeds.js', () => ({ testHtmlXpathSource: vi.fn() }));

let wrapper;

const mountDialog = (draft = { url: 'https://example.com/news', categoryId: 3 }) => {
  const store = createFocusedStores({
    ui: {
      htmlXpathDraft: draft,
      setShowModal: vi.fn()
    }
  });
  wrapper = mount(HtmlXpathFeed, {
    global: {
      plugins: [store.pinia],
      stubs: { BootstrapIcon: true }
    }
  });
  return store;
};

beforeEach(() => vi.clearAllMocks());

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe('HtmlXpathFeed', () => {
  it('keeps the failed page URL immutable and exposes contextual default XPath rules', () => {
    mountDialog();

    expect(wrapper.find('#html-xpath-url').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Page URL');
    expect(wrapper.get('#html-xpath-item').element.value).toContain('self::main');
    expect(wrapper.get('#html-xpath-item').element.value).toContain("' card '");
    expect(wrapper.get('#html-xpath-item').element.value).toContain("' section '");
    expect(wrapper.get('#html-xpath-itemTitle').element.value).toContain('self::h1');
    expect(wrapper.text()).toContain('Relative to each item');
  });

  it('submits the rules and opens the separate bounded-results dialog', async () => {
    testHtmlXpathSource.mockResolvedValue({
      data: {
        matchedItems: 12,
        usableItems: 11,
        previewTruncated: true,
        feed: { title: 'Example News', effectiveUrl: 'https://example.com/news' },
        warnings: [{ code: 'ITEM_SKIPPED', itemIndex: 4 }],
        items: [{
          title: 'First story',
          url: 'https://example.com/story',
          author: 'Ada',
          publishedAt: '2026-09-04T10:00:00.000Z',
          contentText: 'A useful summary.',
          imageUrl: 'https://example.com/image.jpg',
          externalId: 'story-1'
        }]
      }
    });
    const store = mountDialog();

    await wrapper.get('#html-xpath-test-form').trigger('submit');
    await flushPromises();

    expect(testHtmlXpathSource).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/news',
      sourceConfig: expect.objectContaining({
        item: expect.stringContaining('self::main'),
        itemUri: './/a[@href][1]/@href'
      })
    }));
    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      url: 'https://example.com/news',
      accepted: false,
      sourceConfig: expect.objectContaining({ item: expect.stringContaining('self::main') }),
      preview: expect.objectContaining({
        matchedItems: 12,
        usableItems: 11
      })
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('HtmlXpathPreview');
  });

  it('automatically analyzes a failed feed URL and opens its results preview', async () => {
    testHtmlXpathSource.mockResolvedValue({
      data: {
        matchedItems: 10,
        usableItems: 10,
        feed: { title: 'Actualités' },
        warnings: [],
        items: [{ title: 'First story' }]
      }
    });
    const store = mountDialog({
      url: 'https://livre.cfwb.be/actualites',
      categoryId: 3,
      autoAnalyze: true
    });

    await flushPromises();

    expect(testHtmlXpathSource).toHaveBeenCalledOnce();
    expect(testHtmlXpathSource).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://livre.cfwb.be/actualites'
    }));
    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      autoAnalyze: false,
      preview: { matchedItems: 10, usableItems: 10 }
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('HtmlXpathPreview');
  });

  it('shows server diagnostics and keeps the rules editable after failure', async () => {
    testHtmlXpathSource.mockRejectedValue({
      response: { data: { error: 'The item XPath did not match any elements' } }
    });
    mountDialog();

    await wrapper.get('#html-xpath-test-form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('did not match any elements');
    expect(wrapper.vm.isTesting).toBe(false);
  });

  it('returns the URL and rules to Add Feed when closing', async () => {
    const store = mountDialog();

    await wrapper.get('.base-dialog__footer button').trigger('click');

    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      url: 'https://example.com/news',
      categoryId: 3,
      accepted: false
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('NewFeed');
  });
});
