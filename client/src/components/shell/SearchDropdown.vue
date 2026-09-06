<template>
  <section class="search-dropdown" aria-label="Search help and recent searches">
    <p class="search-help"><BootstrapIcon icon="search" decorative /> Search articles by words or tags</p>
    <p class="search-tip"><BootstrapIcon icon="lightbulb-fill" decorative /> Tip: try title:text or tag:name</p>
    <div class="search-examples" aria-label="Search examples">
      <button v-for="example in examples" :key="example" type="button" class="search-example" @click="$emit('select', example)">{{ example }}</button>
    </div>
    <div class="recent-search-header">
      <span>Recent searches</span>
      <button v-if="recentSearches.length" type="button" class="search-clear" @click="$emit('clear')">Clear all</button>
    </div>
    <ul v-if="recentSearches.length" class="recent-search-list">
      <li v-for="query in recentSearches.slice(0, 6)" :key="query" class="recent-search-row">
        <button type="button" class="recent-search-select" :title="query" @click="$emit('select', query)">
          <BootstrapIcon icon="clock-history" decorative />
          <span>{{ query }}</span>
        </button>
        <button type="button" class="recent-search-remove" :aria-label="`Remove search: ${query}`" @click="$emit('remove', query)"><BootstrapIcon icon="x" decorative /></button>
      </li>
    </ul>
    <p v-else class="search-empty">No recent searches yet.</p>
  </section>
</template>

<script setup>
import BootstrapIcon from '../shared/BootstrapIcon.vue';

defineProps({ recentSearches: { type: Array, default: () => [] } });
defineEmits(['select', 'remove', 'clear']);

// articleQueryParser.service.js supports title:, tag:, and author: (including
// quoted title/author phrases). feed:, source:, and content: are not operators.
// The complete syntax reference, including state/date/score filters, is docs/search.md.
const examples = ['title:Verstappen', 'tag:Monza', 'author:"Ada Lovelace"'];
</script>

<style scoped>
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  box-sizing: border-box;
  max-height: min(480px, 65vh);
  overflow-y: auto;
  padding: 12px;
  background: var(--bg-modal);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-modal);
  z-index: var(--layer-dropdown);
  font-size: 13px;
  line-height: 1.5;
}
.search-help, .search-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}
.search-help {
  font-weight: 500;
}
.search-tip, .search-empty {
  color: var(--text-muted);
  font-size: 12px;
}
.search-dropdown svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
.search-tip svg {
  color: var(--article-quality-okay);
}
.search-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.search-dropdown button {
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  border: 0;
}
.search-dropdown .search-example {
  padding: 3px 8px;
  border-radius: var(--radius-compact);
  background: var(--surface-hover);
  color: var(--text-secondary);
  overflow-wrap: anywhere;
  max-width: 100%;
  font-size: 12px;
}
.recent-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid var(--border-default);
  margin-top: 12px;
  padding-top: 10px;
  font-weight: 600;
}
.search-clear {
  color: var(--color-link);
  background: var(--color-transparent);
  padding: 4px 0;
}
.recent-search-list {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
}
.recent-search-row {
  display: flex;
  align-items: center;
  border-radius: var(--radius-compact);
}
.recent-search-select {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  text-align: left;
  color: var(--text-primary);
  background: var(--color-transparent);
  padding: 8px 4px;
}
.recent-search-select span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-search-select svg, .recent-search-remove {
  color: var(--text-muted);
}
.recent-search-remove {
  display: flex;
  flex-shrink: 0;
  padding: 8px;
  background: var(--color-transparent);
  border-radius: var(--radius-compact);
}
.recent-search-row:hover, .search-example:hover, .recent-search-remove:hover {
  background: var(--surface-hover);
}
.recent-search-remove:hover {
  color: var(--text-primary);
}
.search-dropdown button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}
.search-empty {
  margin: 8px 0 0;
}
</style>
