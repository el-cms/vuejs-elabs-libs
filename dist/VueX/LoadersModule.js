import _Object$keys from 'babel-runtime/core-js/object/keys';
import Vue from 'vue';
import cm from '../Common';

/**
 * Default loading message
 * @type {string}
 */
var defaultMessage = 'Chargement...';

export default {
  /**
   * Module's state
   *
   * @type {Object}
   *
   * @property {Object} loaders      - Loaders list
   * @property {Object} smallLoaders - Local loaders list
   */
  state: {
    /**
     * Loaders list
     * @type {Object}
     */
    loaders: {},
    /**
     * Local loaders
     * @type {Object}
     */
    smallLoaders: {}
  },
  /**
   * Module's mutations
   *
   * @type {Object}
   *
   * @property {function} SET_LOADING_STATE        - Sets a loading state
   * @property {function} STOP_LOADING_STATE       - Removes a loading state
   * @property {function} SET_SMALL_LOADING_STATE  - Sets a local loader
   * @property {function} STOP_SMALL_LOADING_STATE - Removes a local loader
   */
  mutations: {
    SET_LOADING_STATE: function SET_LOADING_STATE(state, _ref) {
      var loaderId = _ref.loaderId,
          message = _ref.message;

      Vue.set(state.loaders, loaderId, message);
    },
    STOP_LOADING_STATE: function STOP_LOADING_STATE(state, loaderId) {
      Vue.delete(state.loaders, loaderId);
    },
    SET_SMALL_LOADING_STATE: function SET_SMALL_LOADING_STATE(state, _ref2) {
      var loaderId = _ref2.loaderId,
          payload = _ref2.payload;

      Vue.set(state.smallLoaders, loaderId, payload);
    },
    STOP_SMALL_LOADING_STATE: function STOP_SMALL_LOADING_STATE(state, loaderId) {
      Vue.delete(state.smallLoaders, loaderId);
    }
  },
  /**
   * Module's actions
   *
   * @type {Object}
   *
   * @property {Function} SET_LOADING_STATE        - Sets a loading state, small or normal
   * @property {Function} STOP_LOADING_STATE       - Removes a loader
   * @property {Function} STOP_SMALL_LOADING_STATE - Removes a local loader
   */
  actions: {
    /**
     * Sets a loading state, small or normal
     * @param {Function}                dispatch            - Dispatch method from VueX
     * @param {Function}                commit              - Commit method from VueX
     * @param {string|Object|null|bool} payload             - Loading state config
     * @param {string}                  payload.description - Description
     * @param {function}                payload.callback    - Callback for when the loading is over
     *
     * @return {Object}
     */
    SET_LOADING_STATE: function SET_LOADING_STATE(_ref3, payload) {
      var commit = _ref3.commit,
          dispatch = _ref3.dispatch;

      var sideLoad = cm.isObj(payload);
      if (payload === true) {
        payload = defaultMessage;
      }

      var loaderId = Date.now();

      if (!sideLoad) {
        commit('SET_LOADING_STATE', { loaderId: loaderId, message: payload });
        return {
          done: function done() {
            return dispatch('STOP_LOADING_STATE', loaderId);
          }
        };
      }

      if (payload.loaderId) {
        loaderId = payload.loaderId;
      }

      commit('SET_SMALL_LOADING_STATE', { loaderId: loaderId, payload: payload });
      return {
        loaderId: loaderId,
        done: function done() {
          return dispatch('STOP_SMALL_LOADING_STATE', loaderId);
        }
      };
    },
    /**
     * Removes a loader
     *
     * @param {Function} commit   - Commit method from VueX
     * @param {string}   loaderId - Loader id
     */
    STOP_LOADING_STATE: function STOP_LOADING_STATE(_ref4, loaderId) {
      var commit = _ref4.commit;

      commit('STOP_LOADING_STATE', loaderId);
    },
    /**
     * Removes a local loader
     *
     * @param {Function} commit   - Commit method from VueX
     * @param {string}   loaderId - Small loader id
     */
    STOP_SMALL_LOADING_STATE: function STOP_SMALL_LOADING_STATE(_ref5, loaderId) {
      var commit = _ref5.commit;

      commit('STOP_SMALL_LOADING_STATE', loaderId);
    }
  },

  /**
   * Module's getters
   *
   * @type {Object}
   *
   * @property {function} APP_IS_LOADING           - Returns true if the app is loading something
   * @property {function} LOADING_MESSAGE          - All the loaders
   * @property {function} ALL_SMALL_LOADERS        - List of local loaders
   * @property {function} ONE_SMALL_LOADER         - One local loader by id
   * @property {function} ONE_SMALL_LOADER_APPROX  - One local loader with regex as id
   */
  getters: {
    /**
     * Returns true if the app is loading something
     *
     * @param {Object} state
     *
     * @return {Boolean}
     */
    APP_IS_LOADING: function APP_IS_LOADING(state) {
      return _Object$keys(state.loaders).length > 0;
    },
    /**
     * All the loaders
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    LOADING_MESSAGES: function LOADING_MESSAGES(state) {
      return state.loaders;
    },
    /**
     * List of local loaders
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ALL_SMALL_LOADERS: function ALL_SMALL_LOADERS(state) {
      return state.smallLoaders;
    },
    /**
     * One local loader by id
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ONE_SMALL_LOADER: function ONE_SMALL_LOADER(state) {
      return function (id) {
        return state.smallLoaders[id];
      };
    },
    /**
     * One local loader with regex as id
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ONE_SMALL_LOADER_APPROX: function ONE_SMALL_LOADER_APPROX(state) {
      return function (id) {
        var regex = new RegExp('^' + id);
        for (var l in state.smallLoaders) {
          if (state.smallLoaders.hasOwnProperty(l)) {
            if (regex.test(l)) {
              return state.smallLoaders[l];
            }
          }
        }

        return false;
      };
    }
  }
};