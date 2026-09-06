import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import HtmlXpathPreview from '../src/components/dialogs/feeds/HtmlXpathPreview.vue';
import { createFocusedStores } from './helpers/focusedStores.js';

let wrapper;

const previewDraft = () => ({
  url: 'https://example.com/news',
  categoryId: 3,
  sourceConfig: { item: '//article', itemTitle: './/h2' },
  accepted: false,
  preview: {
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

const mountPreview = () => {
  const store = createFocusedStores({
    ui: {
      htmlXpathDraft: previewDraft(),
      setShowModal: vi.fn()
    }
  });
  wrapper = mount(HtmlXpathPreview, {
    global: {
      plugins: [store.pinia],
      stubs: { BootstrapIcon: true }
    }
  });
  return store;
};

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe('HtmlXpathPreview', () => {
  it('shows extracted intermediate results before acceptance', () => {
    mountPreview();

    expect(wrapper.text()).toContain('Review extracted articles');
    expect(wrapper.text()).toContain('Example News');
    expect(wrapper.text()).toContain('11 usable of 12 matched items');
    expect(wrapper.text()).toContain('First story');
    expect(wrapper.text()).toContain('A useful summary.');
    expect(wrapper.text()).toContain('Showing first 5');
  });

  it('returns to the rule editor without discarding the tested draft', async () => {
    const store = mountPreview();

    await wrapper.get('.app-button--outline-secondary').trigger('click');

    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      url: 'https://example.com/news',
      sourceConfig: { item: '//article', itemTitle: './/h2' }
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('HtmlXpathFeed');
  });

  it('returns reviewed metadata to Add Feed from the back action', async () => {
    const store = mountPreview();

    await wrapper.get('.app-button--secondary').trigger('click');

    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      url: 'https://example.com/news',
      accepted: true
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('NewFeed');
  });

  it('retains an accepted draft for the later persistence step', async () => {
    const store = mountPreview();

    await wrapper.get('.app-button--primary').trigger('click');

    expect(store.uiStore.htmlXpathDraft).toMatchObject({
      url: 'https://example.com/news',
      accepted: true,
      sourceConfig: { item: '//article', itemTitle: './/h2' }
    });
    expect(store.uiStore.setShowModal).toHaveBeenCalledWith('NewFeed');
  });
});
