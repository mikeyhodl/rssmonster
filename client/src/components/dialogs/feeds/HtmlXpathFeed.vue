<template>
  <BaseDialog
    size="xl"
    icon="code-slash"
    show-close
    close-label="Close HTML and XPath dialog"
    :close-disabled="isTesting"
    @close="closeDialog"
  >
    <template #title>HTML + XPath (Web scraping)</template>
    <template #description>
      Select repeated article elements and extract fields relative to each item.
    </template>

    <form id="html-xpath-test-form" class="html-xpath" @submit.prevent="testRules">
      <fieldset :disabled="isTesting">
        <div class="html-xpath__rules">
          <label class="html-xpath__field html-xpath__field--wide" for="html-xpath-item">
            <span>Item XPath <strong aria-hidden="true">*</strong></span>
            <input id="html-xpath-item" v-model.trim="sourceConfig.item" class="app-form-control html-xpath__expression" required spellcheck="false">
            <small>Runs against the whole page and selects every repeated article container.</small>
          </label>

          <label
            v-for="field in optionalFields"
            :key="field.key"
            class="html-xpath__field"
            :for="`html-xpath-${field.key}`"
          >
            <span>{{ field.label }}</span>
            <input
              :id="`html-xpath-${field.key}`"
              v-model.trim="sourceConfig[field.key]"
              class="app-form-control html-xpath__expression"
              :placeholder="field.placeholder"
              spellcheck="false"
            >
            <small>{{ field.help }}</small>
          </label>
        </div>
      </fieldset>

      <p v-if="errorMessage" class="html-xpath__error" role="alert">{{ errorMessage }}</p>

    </form>

    <template #footer>
      <button type="button" class="app-button app-button--secondary base-dialog__button base-dialog__button--secondary" :disabled="isTesting" @click="closeDialog">
        Close
      </button>
      <button type="submit" form="html-xpath-test-form" class="app-button app-button--primary base-dialog__button base-dialog__button--primary" :disabled="isTesting || !canTest" :aria-busy="isTesting ? 'true' : 'false'">
        <BootstrapIcon icon="search" aria-hidden="true" />
        {{ isTesting ? 'Analyzing…' : 'Analyze page' }}
      </button>
    </template>
  </BaseDialog>
</template>

<script>
import { mapStores } from 'pinia';
import { useUiStore } from '../../../store/ui.js';
import { testHtmlXpathSource } from '../../../api/feeds.js';
import BaseDialog from '../BaseDialog.vue';

const DEFAULT_SOURCE_CONFIG = Object.freeze({
  feedTitle: '//title',
  item: "//*[self::main or contains(concat(' ', normalize-space(@class), ' '), ' main ')]//*[self::article or ((self::div or self::li) and (contains(concat(' ', normalize-space(@class), ' '), ' card ') or contains(concat(' ', normalize-space(@class), ' '), ' post ') or contains(concat(' ', normalize-space(@class), ' '), ' entry ') or contains(concat(' ', normalize-space(@class), ' '), ' item ') or contains(concat(' ', normalize-space(@class), ' '), ' section ')) and .//a[@href] and (.//*[self::h1 or self::h2 or self::h3] or .//*[contains(concat(' ', normalize-space(@class), ' '), ' title ')]))]",
  itemTitle: ".//*[self::h1 or self::h2 or self::h3][1] | .//*[contains(concat(' ', normalize-space(@class), ' '), ' title ')][1]",
  itemContent: ".//*[contains(concat(' ', normalize-space(@class), ' '), ' card-text ')] | .//*[contains(concat(' ', normalize-space(@class), ' '), ' summary ')] | .//p",
  itemUri: './/a[@href][1]/@href',
  itemAuthor: '',
  itemTimestamp: ".//time[1]/@datetime | .//*[contains(concat(' ', normalize-space(@class), ' '), ' card-date ')][1] | .//*[contains(concat(' ', normalize-space(@class), ' '), ' date ')][1]",
  itemThumbnail: './/img[1]/@src',
  itemUid: ''
});

const OPTIONAL_FIELDS = Object.freeze([
  { key: 'feedTitle', label: 'Feed title XPath', placeholder: '//title', help: 'Runs against the whole page.' },
  { key: 'itemTitle', label: 'Item title XPath', placeholder: './/h2', help: 'Relative to each item.' },
  { key: 'itemUri', label: 'Item URL XPath', placeholder: './/a[1]/@href', help: 'Relative to each item; relative URLs are resolved automatically.' },
  { key: 'itemContent', label: 'Item content XPath', placeholder: './/div/node()', help: 'All selected nodes are preserved as content.' },
  { key: 'itemAuthor', label: 'Item author XPath', placeholder: './/*[@rel="author"]', help: 'Optional and relative to each item.' },
  { key: 'itemTimestamp', label: 'Item date XPath', placeholder: './/time/@datetime', help: 'Optional ISO 8601 or RFC 2822 date.' },
  { key: 'itemThumbnail', label: 'Item image XPath', placeholder: './/img[1]/@src', help: 'Optional and relative to each item.' },
  { key: 'itemUid', label: 'Stable item ID XPath', placeholder: './/@data-id', help: 'Optional stable publisher identifier.' }
]);

export default {
  name: 'HtmlXpathFeed',
  components: { BaseDialog },
  data() {
    return {
      url: '',
      sourceConfig: { ...DEFAULT_SOURCE_CONFIG },
      optionalFields: OPTIONAL_FIELDS,
      isTesting: false,
      errorMessage: ''
    };
  },
  computed: {
    ...mapStores(useUiStore),
    canTest() {
      return Boolean(this.url && this.sourceConfig.item && (
        this.sourceConfig.itemTitle ||
        this.sourceConfig.itemContent ||
        this.sourceConfig.itemUri
      ));
    }
  },
  created() {
    this.url = this.uiStore.htmlXpathDraft?.url || '';
    this.sourceConfig = {
      ...DEFAULT_SOURCE_CONFIG,
      ...(this.uiStore.htmlXpathDraft?.sourceConfig || {})
    };
  },
  mounted() {
    if (!this.uiStore.htmlXpathDraft?.autoAnalyze) return;
    this.uiStore.setHtmlXpathDraft({
      ...this.uiStore.htmlXpathDraft,
      autoAnalyze: false
    });
    void this.testRules();
  },
  methods: {
    // Tests the current rules through the bounded server adapter used by future crawling.
    async testRules() {
      if (this.isTesting || !this.canTest) return;
      this.isTesting = true;
      this.errorMessage = '';
      try {
        const sourceConfig = Object.fromEntries(
          Object.entries(this.sourceConfig).filter(([, value]) => value)
        );
        const response = await testHtmlXpathSource({
          url: this.url,
          sourceConfig
        });
        this.uiStore.setHtmlXpathDraft({
          ...this.uiStore.htmlXpathDraft,
          url: this.url,
          sourceConfig,
          preview: response.data,
          accepted: false
        });
        this.uiStore.setShowModal('HtmlXpathPreview');
      } catch (error) {
        this.errorMessage = error.response?.data?.error
          || 'Could not analyze this page. Check the URL and XPath rules and try again.';
      } finally {
        this.isTesting = false;
      }
    },
    // Returns to Add Feed while preserving the URL and category selection.
    closeDialog() {
      if (this.isTesting) return;
      this.uiStore.setHtmlXpathDraft({
        ...this.uiStore.htmlXpathDraft,
        url: this.url,
        sourceConfig: Object.fromEntries(
          Object.entries(this.sourceConfig).filter(([, value]) => value)
        ),
        accepted: false
      });
      this.uiStore.setShowModal('NewFeed');
    }
  }
};
</script>

<style scoped>
.html-xpath fieldset { margin: 0; padding: 0; border: 0; }
.html-xpath__rules { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.875rem; margin-top: 1rem; }
.html-xpath__field { display: grid; align-content: start; gap: 0.375rem; color: var(--text-primary); font-size: 0.8125rem; font-weight: 600; }
.html-xpath__field--wide { grid-column: 1 / -1; }
.html-xpath__field small { color: var(--text-secondary); font-size: 0.75rem; font-weight: 400; line-height: 1.35; }
.html-xpath__field strong { color: var(--text-error); }
.html-xpath__expression { font-family: var(--font-family-monospace, monospace); }
.html-xpath__error { margin: 1rem 0 0; padding: 0.625rem 0.75rem; border-radius: 0.375rem; }
.html-xpath__error { border: 1px solid var(--border-danger); background: var(--bg-danger-subtle); color: var(--text-danger); }
@media (max-width: 700px) { .html-xpath__rules { grid-template-columns: 1fr; } .html-xpath__field--wide { grid-column: auto; } }
</style>
