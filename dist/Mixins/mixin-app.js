export default {
  computed: {
    /**
     * Checks if the app is loading (initial data loading)
     *
     * @return {boolean}
     */
    appIsLoading: function appIsLoading() {
      return this.$store.getters.APP_IS_LOADING;
    }
  }
};