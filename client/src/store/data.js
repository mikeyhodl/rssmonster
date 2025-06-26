import { defineStore } from 'pinia';
import axios from 'axios';

export const useStore = defineStore('data', {
  state: () => ({
    currentSelection: {
        status: 'unread',
        categoryId: '%',
        feedId: '%',
        search: null,
        sort: 'DESC'
    },
    filter: 'full',
    categories: [],
    unreadCount: 0,
    readCount: 0,
    starCount: 0,
    hotCount: 0,
    showModal: false,
    newUnreads: 0,
    refreshCategories: 0
  }),
  actions: {
    setCategories(categories) {
      this.categories = categories;
    },
    async fetchCurrentSelection(token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (token) {
        //retrieve settings on initial load with either previous query or default settings. This will trigger the watch to get the articles
        try {
          const response = await axios.get(import.meta.env.VITE_VUE_APP_HOSTNAME + "/api/setting");
          this.currentSelection = response.data;
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
    },
    setFilter(filter) {
      this.filter = filter;
    },
    setCategories(categories) {
      this.categories = categories;
    },
    setUnreadCount(count) {
      this.unreadCount = count;
    },
    setReadCount(count) {
      this.readCount = count;
    },
    setStarCount(count) {
      this.starCount = count;
    },
    setHotCount(count) {
      this.hotCount = count;
    },
    setShowModal(show) {
      this.showModal = show;
    },
    setNewUnreads(count) {  
      this.newUnreads = count;
    },
    increaseStarCount() {
      this.starCount++;
    },
    decreaseStarCount() {
      if (this.starCount > 0) {
        this.starCount--;
      }
    },
    increaseReadCount(article) {
      //find the category and feed index
      var categoryIndex = this.categories.findIndex(category => category.id === article.feed.categoryId);
      var feedIndex = this.categories[categoryIndex].feeds.findIndex(feed => feed.id === article.feedId);
      //increase the read count and decrease the unread count
      //avoid having any negative numbers
      if (this.categories[categoryIndex].unreadCount > 0) {
        this.categories[categoryIndex].unreadCount = this.categories[categoryIndex].unreadCount - 1;
        this.categories[categoryIndex].readCount = this.categories[categoryIndex].readCount + 1;
      }
      //avoid having any negative numbers
      if (this.categories[categoryIndex].feeds[feedIndex].unreadCount > 0) {
        this.categories[categoryIndex].feeds[feedIndex].unreadCount = this.categories[categoryIndex].feeds[feedIndex].unreadCount - 1;
        this.categories[categoryIndex].feeds[feedIndex].readCount = this.categories[categoryIndex].feeds[feedIndex].readCount + 1;
      }
      //increase total counts
      if (this.unreadCount > 0) {
        this.readCount = this.readCount + 1;
        this.unreadCount = this.unreadCount - 1;
      }
    },
    increaseRefreshCategories() {
      this.refreshCategories++;
    },
    setSelectedStatus(status) {
      this.currentSelection.status = status;
    },
    setSelectedCategoryId(categoryId) {
      this.currentSelection.categoryId = categoryId;
    },
    setSelectedFeedId(feedId) {
      this.currentSelection.feedId = feedId;
    },
    setSelectedSearch(search) {
      this.currentSelection.search = search;
    },
    setSelectedSort(sort) {
      this.currentSelection.sort = sort;
    }
  },
  getters: {
    getSelectedStatus: (data) => {
      return data.currentSelection.status;
    },
    getSelectedCategoryId: (data) => {
      return data.currentSelection.categoryId;
    },
    getSelectedFeedId: (data) => {
      return data.currentSelection.feedId;
    },
    getSelectedSearch: (data) => {
      return data.currentSelection.search;
    },
    getSelectedSort: (data) => {
      return data.currentSelection.sort;
    },
    getCategories: (data) => {
      return data.categories;
    },
    getCurrentSelection: (data) => {
      return data.currentSelection;
    },
    getFilter: (data) => {
      return data.filter;
    },
    getCategories: (data) => {
      return data.categories;
    },
    getUnreadCount: (data) => {
      return data.unreadCount;
    },
    getReadCount: (data) => {
      return data.readCount;
    },
    getStarCount: (data) => {
      return data.starCount;
    },
    getHotCount: (data) => {
      return data.hotCount;
    },
    getShowModal: (data) => {
      return data.showModal;
    },
    getNewUnreads: (data) => {
      return data.newUnreads;
    }
  }
});

export default useStore