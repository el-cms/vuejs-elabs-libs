import _Promise from 'babel-runtime/core-js/promise';
import Vue from 'vue';

var TOKEN_ISSUES = ['Expired token', 'Syntax error, malformed JSON', 'Signature verification failed', 'Unknown JSON error: 5', 'Unexpected control character found'];

export var resetters = [];

/**
 * VueX Store configuration
 *
 * @module
 *
 * @type {Store}
 *
 * @property {Object} state - VueX state
 * @property {Object} mutations - VueX mutations
 * @property {Object} actions - VueX actions
 * @property {Object} getters - VueX getters
 */
export default {
  /**
   * VueX State
   *
   * @type {object}
   *
   * @property {boolean} generalError         - Define if the app is in a general error state
   * @property {string}  generalErrorMessage  - Message to be displayed in case of general error
   * @property {boolean} initializedUserData  - Is the page loading users data
   * @property {boolean} initializingPageData - Is the page loading ?
   * @property {boolean} pageNotFound         - Defines the 404 error state
   * @property {string}  pageNotFoundMessage  - Message for the 404 error
   * @property {Object}  elements             - Some page elements states (modals, drawers, etc...)
   */
  state: {
    // Various page's elements states
    elements: {},
    // 5xx errors
    generalError: false,
    generalErrorMessage: '',
    // General data used for the app (as config, translations, etc...
    initializingAppData: false,
    initializedAppData: false,
    // Current page's data
    initializingPageData: false,
    initializedPageData: false,
    // User data that should be accessible everywhere
    initializingUserData: false,
    initializedUserData: false,
    // 404
    pageNotFound: false,
    pageNotFoundMessage: ''
  },
  /**
   * VueX mutations
   *
   * @type {Object}
   *
   * @property {function} SET_ELEMENT
   * @property {function} SET_ERROR_500
   * @property {function} SET_ERROR_404
   * @property {function} INITIALIZING_APP_DATA
   * @property {function} INITIALIZED_APP_DATA
   * @property {function} INITIALIZING_PAGE_DATA
   * @property {function} INITIALIZED_PAGE_DATA
   * @property {function} INITIALIZING_USER_DATA
   * @property {function} INITIALIZED_USER_DATA
   * @property {function} RESET_DATA
   */
  mutations: {
    SET_ELEMENT: function SET_ELEMENT(state, _ref) {
      var elementId = _ref.elementId,
          status = _ref.status;

      Vue.set(state.elements, elementId, status);
    },
    SET_ERROR_500: function SET_ERROR_500(state, _ref2) {
      var status = _ref2.status,
          message = _ref2.message;

      Vue.set(state, 'generalError', status);
      Vue.set(state, 'generalErrorMessage', message);
    },
    SET_ERROR_404: function SET_ERROR_404(state, _ref3) {
      var status = _ref3.status,
          message = _ref3.message;

      Vue.set(state, 'pageNotFound', status);
      Vue.set(state, 'pageNotFoundMessage', message);
    },

    INITIALIZING_APP_DATA: function INITIALIZING_APP_DATA(state, loadingState) {
      Vue.set(state, 'initializingAppData', loadingState);
    },
    INITIALIZED_APP_DATA: function INITIALIZED_APP_DATA(state) {
      Vue.set(state, 'initializedAppData', true);
    },
    INITIALIZING_USER_DATA: function INITIALIZING_USER_DATA(state, loadingState) {
      Vue.set(state, 'initializingUserData', loadingState);
    },
    INITIALIZED_USER_DATA: function INITIALIZED_USER_DATA(state) {
      Vue.set(state, 'initializedUserData', true);
    },
    INITIALIZING_PAGE_DATA: function INITIALIZING_PAGE_DATA(state, loadingState) {
      Vue.set(state, 'initializingPageData', loadingState);
    },
    INITIALIZED_PAGE_DATA: function INITIALIZED_PAGE_DATA(state) {
      Vue.set(state, 'initializingPageData', true);
    }
  },
  /**
   * VueX Actions
   *
   * @type {Object}
   *
   * @property {function} RESET_STATE
   * @property {function} SET_PAGE_INITIALIZING
   * @property {function} INITIALIZE
   * @property {function} SET_ELEMENT_STATE
   * @property {function} SET_500
   * @property {function} SET_400
   * @property {function} ERROR_MANAGER
   */
  actions: {
    RESET_STATE: function RESET_STATE(_ref4) {
      var commit = _ref4.commit;

      return _Promise.all(resetters).then(function () {
        commit('INITIALIZED_APP_DATA', false);
        commit('INITIALIZED_PAGE_DATA', false);
        commit('INITIALIZED_USER_DATA', false);
      });
    },
    SET_PAGE_INITIALIZING: function SET_PAGE_INITIALIZING(_ref5, state) {
      var commit = _ref5.commit;

      commit('INITIALIZING_PAGE_DATA', state);
    },

    INITIALIZE: function INITIALIZE(_ref6) {
      var dispatch = _ref6.dispatch,
          commit = _ref6.commit,
          state = _ref6.state;

      if (state.auth.authenticated === true && state.initializedUserData === false) {
        return dispatch('LOAD_USER', state.auth.user.id) // @todo fix this when API has something to play with
        .then(function () {
          commit('INITIALIZE_USER_DATA');
          return _Promise.resolve();
        }).catch(function () {
          return _Promise.reject(new Error('User data initialization failure'));
        });
      }

      return _Promise.resolve();
    },
    SET_ELEMENT_STATE: function SET_ELEMENT_STATE(_ref7, _ref8) {
      var commit = _ref7.commit;
      var drawerId = _ref8.drawerId,
          status = _ref8.status;

      commit('SET_DRAWER', { drawerId: drawerId, status: status });
      return _Promise.resolve();
    },

    SET_500: function SET_500(_ref9, payload) {
      var commit = _ref9.commit;

      if (payload === false) {
        payload = { status: false, message: '' };
      }
      commit('SET_ERROR_500', payload);
    },
    SET_404: function SET_404(_ref10, payload) {
      var commit = _ref10.commit;

      if (payload === false) {
        payload = { status: false, message: '' };
      }
      commit('SET_ERROR_404', payload);
    },
    /**
     * Intercepts fatal error messages as expired tokens, etc...
     *
     * @param {Function} dispatch     - Dispatch method from VueX
     * @param {Object}   response     - Api response
     * @returns {Promise}
     * @constructor
     */
    ERROR_MANAGER: function ERROR_MANAGER(_ref11, response) {
      var dispatch = _ref11.dispatch,
          commit = _ref11.commit;

      // Check for connectivity
      if (!response.body && response.status === 0) {
        dispatch('SET_500', { status: true, message: 'Serveur indisponible' });
        // return Promise.reject(response)
      }

      // 500 errors
      // @todo Stop other loaders if any
      // @see Bluebird documentation on how to cancel promises.
      if (response.status === 500) {
        dispatch('SET_500', { status: true, message: response.data.message });
        // return Promise.reject(response)
      }

      // Token issues:
      if (response.hasOwnProperty('body') && response.body.hasOwnProperty('data')) {
        if (TOKEN_ISSUES.indexOf(response.body.data.message) > -1) {
          dispatch('SET_500', { status: true, message: 'Votre session a expiré, veuillez vous reconnecter.' });
          dispatch('LOGOUT', true);

          return _Promise.reject(response);
        }
      }

      // console.log('Unknown error', response)
      return _Promise.reject(response);
    }
  },
  /**
   * VueX getters
   *
   * @type {Object}
   *
   * @property {function} IS_PAGE_INITIALIZING
   * @property {function} GET_ELEMENT_STATE
   * @property {function} IS_404
   * @property {function} E404_MESSAGE
   * @property {function} IS_500
   * @property {function} E500_MESSAGE
   */
  getters: {
    IS_PAGE_INITIALIZING: function IS_PAGE_INITIALIZING(state) {
      return state.initializingPageData || state.initializingUserData || state.initializingAppData;
    },
    GET_ELEMENT_STATE: function GET_ELEMENT_STATE(state) {
      return function (elementId) {
        return state.elements[elementId];
      };
    },
    IS_404: function IS_404(state) {
      return state.pageNotFound;
    },
    E404_MESSAGE: function E404_MESSAGE(state) {
      return state.pageNotFoundMessage;
    },
    IS_500: function IS_500(state) {
      return state.generalError;
    },
    E500_MESSAGE: function E500_MESSAGE(state) {
      return state.generalErrorMessage;
    }
  }
};