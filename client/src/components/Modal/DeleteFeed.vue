<template>
    <div class="modal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Delete feed</h5>
            </div>
            <div class="modal-body">
                <p>Are you sure to delete this feed?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" @click="deleteFeed">Delete feed</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="$store.data.setShowModal('')">Close</button>
            </div>
            </div>
        </div>
    </div>
</template>

<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-dialog{
    max-width: 600px;
    width: 100%;
}
</style>

<script>
import axios from 'axios';
import helper from '../../services/helper.js';
export default {
    name: 'DeleteFeed',
    created: function() {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.$store.auth.token}`;
    },
    methods: {
        async deleteFeed() {
            console.log("Deleting feed with id: " + this.$store.data.currentSelection.feedId);

            //delete category
            axios.delete(import.meta.env.VITE_VUE_APP_HOSTNAME + "/api/feeds/" + this.$store.data.currentSelection.feedId).then(
                () => {
                //find the index of both the category and feed
                var indexCategory = helper.findIndexById(this.$store.data.categories, this.$store.data.currentSelection.categoryId);

                //find the feed using the indexCategory
                this.inputFeed = helper.findArrayById(this.$store.data.categories[indexCategory].feeds, this.$store.data.currentSelection.feedId);

                //remove the feed from the store
                this.$store.data.categories[indexCategory].feeds = helper.arrayRemove(
                    this.$store.data.categories[indexCategory].feeds,
                    this.inputFeed
                );

                //set the feed selection back to all
                this.$store.data.currentSelection.feedId = "%";

                //close the modal
                this.$store.data.setShowModal('');
                },
                response => {
                    /* eslint-disable no-console */
                    console.log("oops something went wrong", response);
                    /* eslint-enable no-console */
                    this.$store.data.setShowModal('');
                }
            );
        }
    }
}
</script>