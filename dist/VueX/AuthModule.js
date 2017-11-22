import _Promise from 'babel-runtime/core-js/promise';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
/**
 * Custom auth module
 */

import Vue from 'vue';
//import { ADD_TOAST_MESSAGE } from 'vuex-toast'
import api from '../Api';

/**
 * Expired session string
 * @type {string}
 */
var forcedDisconnect = 'Votre session a expiré. Veuillez vous reconnecter.';

/**
 * Logout success string
 * @type {string}
 */
var logoutMessage = 'Vous êtes bien déconnecté(e)';

/**
 * Returns default values for an user
 *
 * @return {{username, role}}
 */
var defaultUserInfos = function defaultUserInfos() {
  return {
    username: null,
    role: null
  };
};

/**
 * Logs an user and add its token in localStorage
 *
 * @param {function} commit
 * @param {function} response
 */
var logUserIn = function logUserIn(commit, response) {
  localStorage.setItem('token', response.token);
  localStorage.setItem('user', _JSON$stringify(response.user));

  commit('SET_AUTH_USER', response.user);
  commit('SET_AUTH_STATE', true);
};

/**
 * Authorisation VueX module
 *
 * @module
 */
export default {
  /**
   * Module's state
   *
   * @type {Object}
   *
   * @property {boolean} state
   * @property {Object} user
   */
  state: {
    /**
     * Whether the user is authenticated or not
     * @type {boolean}
     */
    authenticated: false,
    /**
     * Default user infos
     * @type {Object}
     */
    user: defaultUserInfos()
  },
  /**
   * Module's mutations
   *
   * @type {Object}
   *
   * @property {function} SET_AUTH_USER
   * @property {function} SET_AUTH_STATE
   */
  mutations: {
    /**
     * Setter for an auth user
     *
     * @param {Object} state - Module state
     * @param {Object} data  - User data
     */
    SET_AUTH_USER: function SET_AUTH_USER(state, data) {
      Vue.set(state, 'user', data);
    },
    /**
     * Setter for auth state
     *
     * @param {Object}  state - Module state
     * @param {Boolean} data  - Auth state
     */
    SET_AUTH_STATE: function SET_AUTH_STATE(state, data) {
      Vue.set(state, 'authenticated', data);
    }
  },
  /**
   * Module's actions
   *
   * @type {Object}
   *
   * @property {Function} LOGIN
   * @property {Function} LOGOUT
   * @property {Function} FILL_AUTH_FROM_COOKIE
   * @property {Function} ACTIVATE
   * @property {Function} ASK_FOR_RESEND
   * @property {Function} ASK_FOR_RESET
   * @property {Function} RESET_PASSWORD
   * @property {Function} CHANGE_PASSWORD
   */
  actions: {
    /**
     * Login action
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     * @param {Object}   payload  - Request payload
     *
     * @return {Promise}
     */
    LOGIN: function LOGIN(_ref, payload) {
      var dispatch = _ref.dispatch,
          commit = _ref.commit;
      return api.post('users/login.json', payload, 'Connection...').then(function (_ref2) {
        var data = _ref2.data;

        logUserIn(commit, data);
        return _Promise.resolve(data.user);
      }).catch(function (error) {
        return _Promise.reject(error);
      });
    },
    /**
     * Logs an user out and resets the state
     *
     * @param {Function} dispatch       - Dispatch method from VueX
     * @param {Function} commit         - Commit method from VueX
     * @param {boolean}  [forced=false] - Flags that's true if the logout is forced (i.e.: expired session)
     *
     * @return {Promise}
     */
    LOGOUT: function LOGOUT(_ref3) {
      var commit = _ref3.commit,
          dispatch = _ref3.dispatch;
      var forced = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      commit('SET_AUTH_STATE', false);
      commit('SET_AUTH_USER', defaultUserInfos());

      localStorage.clear();

      var text = forced ? forcedDisconnect : logoutMessage;
      var type = forced ? 'warning' : 'success';
      dispatch('RESET_STATE').then(function () {
        // dispatch(ADD_TOAST_MESSAGE, {text, type})
      });

      return _Promise.resolve();
    },
    /**
     * Fills the state from localstorage
     *
     * @param {Function} commit - Commit method from VueX
     */
    FILL_AUTH_FROM_COOKIE: function FILL_AUTH_FROM_COOKIE(_ref4) {
      var commit = _ref4.commit;

      if (localStorage.getItem('token')) {
        commit('SET_AUTH_STATE', true);
        commit('SET_AUTH_USER', JSON.parse(localStorage.getItem('user')));
      }
    },
    /**
     * Signs up an user
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     * @param {Object}   payload  - Request payload
     *
     * @return {Promise}
     */
    SIGNUP: function SIGNUP(_ref5, payload) {
      var dispatch = _ref5.dispatch,
          commit = _ref5.commit;
      return api.post('users/add.json', payload, 'Enregistrement...');
    },
    /**
     * Activates an user's account
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     * @param {string}   payload  - Activation key
     *
     * @return {Promise}
     */
    ACTIVATE: function ACTIVATE(_ref6, payload) {
      var dispatch = _ref6.dispatch,
          commit = _ref6.commit;
      return api.post('users/activate.json', payload, 'Validation en cours').then(function (_ref7) {
        var data = _ref7.data;

        //dispatch(ADD_TOAST_MESSAGE, {text: 'Votre compte est activé', type: 'success'})
        logUserIn(commit, data);
        return _Promise.resolve();
      }).catch(function (error) {
        //dispatch(ADD_TOAST_MESSAGE, {
        //  text: 'Une erreur est survenue lors de la validation de votre compte.',
        //  type: 'error'
        //})
        return _Promise.reject(error);
      });
    },
    /**
     * Re-sends an activation email
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {string}   payload  - Email address
     *
     * @return {Promise}
     */
    ASK_FOR_RESEND: function ASK_FOR_RESEND(_ref8, payload) {
      var dispatch = _ref8.dispatch;
      return api.post('users/resend_activation.json', payload, 'Envoi du mail en cours');
    },

    /**
     * Sends an email to reset the password
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {string}   payload  - Email address
     *
     * @return {Promise}
     */
    ASK_FOR_RESET: function ASK_FOR_RESET(_ref9, payload) {
      var dispatch = _ref9.dispatch;
      return api.post('users/lost_password.json', payload, 'Demande de lien en cours');
    },
    /**
     * Resets a password
     *
     * @param {Function} dispatch         - Dispatch method from VueX
     * @param {Function} commit           - Commit method from VueX
     * @param {Object}   payload          - Payload to be sent
     * @param {string}   payload.password - New password
     * @param {string}   payload.key      - Reset token
     *
     * @return {Promise}
     */
    RESET_PASSWORD: function RESET_PASSWORD(_ref10, payload) {
      var dispatch = _ref10.dispatch,
          commit = _ref10.commit;
      return api.post('users/reset_password.json', payload, 'Changement de mot de passe').then(function (_ref11) {
        var data = _ref11.data;

        //dispatch(ADD_TOAST_MESSAGE, {text: 'Mot de passe changé avec succès', type: 'success'})
        logUserIn(commit, data);
        return _Promise.resolve();
      }).catch(function (error) {
        //dispatch(ADD_TOAST_MESSAGE, {
        //  text: 'Une erreur est survenue lors du changement de mot de passe',
        //  type: 'error'
        //})
        return _Promise.reject(error);
      });
    },

    /**
     *
     * @param {Function} dispatch                         - Dispatch method from VueX
     * @param {Function} commit                           - Commit method from VueX
     * @param {Object}   payload                          - Payload to be sent
     * @param {Object}   payload.current_password         - Current password
     * @param {Object}   payload.password                 - New password
     * @param {Object}   payload.password_confirm         - Confirmation password
     *
     * @return {Promise}
     */
    CHANGE_PASSWORD: function CHANGE_PASSWORD(_ref12, payload) {
      var dispatch = _ref12.dispatch,
          commit = _ref12.commit;
      return api.post('users/update_password.json', payload, 'Enregistrement du mot de passe en cours').then(function (_ref13) {
        var data = _ref13.data;

        logUserIn(commit, data);
        //dispatch(ADD_TOAST_MESSAGE, {text: 'Mot de passe mis à jour', type: 'success'})
        return _Promise.resolve(data);
      }).catch(function (err) {
        // console.error(`Error for PATCH_${upperSingularName}`, err);
        //dispatch(ADD_TOAST_MESSAGE, {
        //  text: 'Une erreur est survenue pendant la mise à jour du mot de passe.',
        //  type: 'error'
        //})
        return _Promise.reject(err);
      });
    }
  },
  /**
   * Module's getters
   *
   * @type {Object}
   *
   * @property {function} USER
   * @property {function} IS_AUTH
   */
  getters: {
    /**
     * Returns the logged in user
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    USER: function USER(state) {
      return state.user;
    },
    /**
     * Checks if the user is authenticated
     *
     * @param {Object} state - Current module state
     *
     * @return {Boolean}
     */
    IS_AUTH: function IS_AUTH(state) {
      return state.authenticated;
    }
  }
};