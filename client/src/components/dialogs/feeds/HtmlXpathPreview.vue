<template>
  <BaseDialog
    size="xl"
    icon="eye"
    show-close
    close-label="Return to Add Feed"
    @close="returnToAddFeed"
  >
    <template #title>Review extracted articles</template>
    <template #description>
      Check the content RSSMonster found before accepting this webpage source.
    </template>

    <section class="html-xpath-preview" aria-labelledby="html-xpath-preview-summary">
      <header class="html-xpath-preview__header">
        <div>
          <h3 id="html-xpath-preview-summary">{{ preview.feed.title || 'Webpage preview' }}</h3>
          <p>{{ preview.usableItems }} usable of {{ preview.matchedItems }} matched items</p>
        </div>
        <span v-if="preview.previewTruncated" class="html-xpath-preview__badge">Showing first 5</span>
      </header>

      <p v-if="preview.warnings.length" class="html-xpath-preview__warning">
        {{ preview.warnings.length }} extraction {{ preview.warnings.length === 1 ? 'warning' : 'warnings' }}
      </p>

      <ol class="html-xpath-preview__items">
        <li v-for="(item, index) in preview.items" :key="item.externalId || item.url || index" class="html-xpath-preview__item">
          <h4>{{ item.title || 'Untitled item' }}</h4>
          <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.url }}</a>
          <dl v-if="item.author || item.publishedAt || item.imageUrl">
            <div v-if="item.author"><dt>Author</dt><dd>{{ item.author }}</dd></div>
            <div v-if="item.publishedAt"><dt>Published</dt><dd>{{ formatDate(item.publishedAt) }}</dd></div>
            <div v-if="item.imageUrl"><dt>Image</dt><dd>{{ item.imageUrl }}</dd></div>
          </dl>
          <p v-if="item.contentText" class="html-xpath-preview__content">{{ item.contentText }}</p>
        </li>
      </ol>
    </section>

    <template #footer>
      <button type="button" class="app-button app-button--secondary base-dialog__button base-dialog__button--secondary" @click="returnToAddFeed">
        Back to Add Feed
      </button>
      <button type="button" class="app-button app-button--outline-secondary base-dialog__button" @click="adjustRules">
        Adjust rules
      </button>
      <button type="button" class="app-button app-button--primary base-dialog__button base-dialog__button--primary" @click="acceptPreview">
        <BootstrapIcon icon="check2" aria-hidden="true" />
        Accept
      </button>
    </template>
  </BaseDialog>
</template>

<script>
import { mapStores } from 'pinia';
import { useUiStore } from '../../../store/ui.js';
import BaseDialog from '../BaseDialog.vue';

const EMPTY_PREVIEW = Object.freeze({
  feed: {},
  matchedItems: 0,
  usableItems: 0,
  previewTruncated: false,
  warnings: [],
  items: []
});

export default {
  name: 'HtmlXpathPreview',
  components: { BaseDialog },
  computed: {
    ...mapStores(useUiStore),
    preview() {
      return this.uiStore.htmlXpathDraft?.preview || EMPTY_PREVIEW;
    }
  },
  methods: {
    formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    },
    // Returns to the tested rules without losing the preview draft.
    adjustRules() {
      this.uiStore.setShowModal('HtmlXpathFeed');
    },
    // Returns the reviewed source to Add Feed, where the user makes the final save decision.
    returnToAddFeed() {
      this.uiStore.setHtmlXpathDraft({
        ...this.uiStore.htmlXpathDraft,
        accepted: true
      });
      this.uiStore.setShowModal('NewFeed');
    },
    // Returns the accepted page metadata and rules to the Add Feed form.
    acceptPreview() {
      this.returnToAddFeed();
    }
  }
};
</script>

<style scoped>
.html-xpath-preview__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.html-xpath-preview__header h3, .html-xpath-preview__header p { margin: 0; }
.html-xpath-preview__header p { margin-top: 0.25rem; color: var(--text-secondary); font-size: 0.8125rem; }
.html-xpath-preview__badge { padding: 0.25rem 0.5rem; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 0.75rem; white-space: nowrap; }
.html-xpath-preview__warning { margin: 1rem 0 0; padding: 0.625rem 0.75rem; border: 1px solid var(--border-warning); border-radius: 0.375rem; background: var(--surface-warning); color: var(--color-warning); }
.html-xpath-preview__items { display: grid; gap: 0.75rem; margin: 1rem 0 0; padding: 0; list-style: none; }
.html-xpath-preview__item { min-width: 0; padding: 0.875rem; border: 1px solid var(--border-subtle); border-radius: 0.5rem; background: var(--surface-chrome); }
.html-xpath-preview__item h4 { margin: 0 0 0.375rem; color: var(--text-primary); }
.html-xpath-preview__item a, .html-xpath-preview__item dd { overflow-wrap: anywhere; }
.html-xpath-preview__item dl { display: grid; gap: 0.25rem; margin: 0.625rem 0 0; font-size: 0.75rem; }
.html-xpath-preview__item dl div { display: grid; grid-template-columns: 5rem minmax(0, 1fr); gap: 0.5rem; }
.html-xpath-preview__item dt { color: var(--text-secondary); font-weight: 600; }
.html-xpath-preview__item dd { margin: 0; color: var(--text-primary); }
.html-xpath-preview__content { display: -webkit-box; margin: 0.625rem 0 0; overflow: hidden; color: var(--text-secondary); font-size: 0.8125rem; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
</style>
