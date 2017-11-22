import _Promise from 'babel-runtime/core-js/promise';
/**
 * Simple wrapper for ajax api calls
 * @author Manuel Tancoigne <m.tancoigne@gmail.com>
 *
 * @module api/index
 */
import Vue from 'vue';
import VueResource from 'vue-resource';
import { Store } from '../Store';

Vue.use(VueResource);

export var config = {
  apiBase: null

  /**
   * Matches absolute URLS
   *
   * @type {RegExp}
   */
};var URL_TEST = new RegExp(/^(https?:\/\/)/);

/**
 * Creates an URL to target the API:
 *  keeping the absolute url for custom ones, and completing the
 *  relative path for an API call
 *
 * @param {string} url - Url to fetch
 */
var createUrl = function createUrl(url) {
  return URL_TEST.test(url) ? url : '' + config.apiBase + url;
};

/**
 * Adds some headers to the request
 *
 * @param {string|null} [fakeUserId=null] - Alternative user id if different from main user.
 */
var prepareRequest = function prepareRequest() {
  var fakeUserId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  var token = null;
  // Getting the token from storage
  //if (fakeUserId !== null) {
  //  token = localStorage.getItem(`multi[${fakeUserId}]`) || null
  //} else {
  //  token = localStorage.getItem('token') || null
  //}

  // Adding the token to request
  if (token !== null) {
    Vue.http.headers.common.Authorization = 'Bearer ' + token;
  } else {
    delete Vue.http.headers.common['Authorization'];
  }
};

/**
 * A proxy to handle a given kind of async request.
 * It will set the app's loading state and is able to fake an user, sending a custom API token if the user has logged
 * in using the multiAuth functionality.
 *
 * @function apiProxyMethod
 *
 * @param {string}             url                - The url to fetch
 * @param {Object}             payload            - The payload to send
 * @param {Object|string|null} [loadingText=true] - Text to associate to the loading state or local loader
 *   configuration
 * @param {string|null}        [userId=null]      - User id if different of the main user
 *
 * @return {Promise}
 */

/**
 * Generic request generator
 *
 * @param {string} method - Method name
 *
 * @return {apiProxyMethod}
 */
var requestMethod = function requestMethod(method) {
  return function (url, payload) {
    var loadingText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var fakeUserId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    var loader = Store.dispatch('SET_LOADING_STATE', loadingText);
    console.log(url, payload);
    prepareRequest(fakeUserId);
    return Vue.http[method](createUrl(url), payload).then(function (response) {
      return _Promise.resolve(response.body);
    }).catch(function (error) {
      return Store.dispatch('ERROR_MANAGER', error);
    }).finally(function () {
      loader.then(function (r) {
        return r.done();
      });
    });
  };
};

/**
 * Simple wrapper for ajax api calls
 *
 * @property {apiProxyMethod} get    - "Get" call proxy
 * @property {apiProxyMethod} post   - "Post" call proxy
 * @property {apiProxyMethod} patch  - "Patch" call proxy
 * @property {apiProxyMethod} put    - "Put" call proxy
 * @property {apiProxyMethod} delete - "Delete" call proxy
 *
 * @module api
 */
export default {
  get: requestMethod('get'),
  post: requestMethod('post'),
  patch: requestMethod('post'),
  put: requestMethod('put'),
  delete: requestMethod('delete'),
  config: config
};