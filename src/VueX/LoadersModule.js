import Vue from 'vue'
import cm from '../Common'

/**
 * Default loading message
 * @type {string}
 */
const defaultMessage = 'Chargement...'

export default{
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
    SET_LOADING_STATE: (state, {loaderId, message}) => {
      Vue.set(state.loaders, loaderId, message)
    },
    STOP_LOADING_STATE: (state, loaderId) => {
      Vue.delete(state.loaders, loaderId)
    },
    SET_SMALL_LOADING_STATE: (state, {loaderId, payload}) => {
      Vue.set(state.smallLoaders, loaderId, payload)
    },
    STOP_SMALL_LOADING_STATE: (state, loaderId) => {
      Vue.delete(state.smallLoaders, loaderId)
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
    SET_LOADING_STATE: ({commit, dispatch}, payload) => {
      const sideLoad = cm.isObj(payload)
      if (payload === true) {
        payload = defaultMessage
      }

      let loaderId = Date.now()

      if (!sideLoad) {
        commit('SET_LOADING_STATE', {loaderId, message: payload})
        return {
          done: () => dispatch('STOP_LOADING_STATE', loaderId)
        }
      }

      if (payload.loaderId) {
        loaderId = payload.loaderId
      }

      commit('SET_SMALL_LOADING_STATE', {loaderId, payload})
      return {
        loaderId,
        done: () => dispatch('STOP_SMALL_LOADING_STATE', loaderId)
      }
    },
    /**
     * Removes a loader
     *
     * @param {Function} commit   - Commit method from VueX
     * @param {string}   loaderId - Loader id
     */
    STOP_LOADING_STATE: ({commit}, loaderId) => {
      commit('STOP_LOADING_STATE', loaderId)
    },
    /**
     * Removes a local loader
     *
     * @param {Function} commit   - Commit method from VueX
     * @param {string}   loaderId - Small loader id
     */
    STOP_SMALL_LOADING_STATE: ({commit}, loaderId) => {
      commit('STOP_SMALL_LOADING_STATE', loaderId)
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
    APP_IS_LOADING: state => Object.keys(state.loaders).length > 0,
    /**
     * All the loaders
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    LOADING_MESSAGES: state => state.loaders,
    /**
     * List of local loaders
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ALL_SMALL_LOADERS: state => state.smallLoaders,
    /**
     * One local loader by id
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ONE_SMALL_LOADER: state => id => state.smallLoaders[id],
    /**
     * One local loader with regex as id
     *
     * @param {Object} state
     *
     * @return {Object}
     */
    ONE_SMALL_LOADER_APPROX: state => (id) => {
      const regex = new RegExp(`^${id}`)
      for (const l in state.smallLoaders) {
        if (state.smallLoaders.hasOwnProperty(l)) {
          if (regex.test(l)) {
            return state.smallLoaders[l]
          }
        }
      }

      return false
    }
  }
}
