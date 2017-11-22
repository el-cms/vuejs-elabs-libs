import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _typeof from 'babel-runtime/helpers/typeof';
import _Promise from 'babel-runtime/core-js/promise';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _extends from 'babel-runtime/helpers/extends';
/**
 * Creates mutations, actions and getters for models
 *
 * @author Manuel Tancoigne <m.tancoigne@gmail.com>
 * @copyright MIT license
 */
import Vue from 'vue';
import api from '../Api';
import Modeler from '../Modeler';
import cm from '../Common';
import Notifier from '../Notifier';
// Modulator-related files
import messages from './locale/en';
import { notAvailable, patchStructure, dispatchRelations, setLoaderMessage } from './functions';

/**
 * Vuex module generator for models defined in models.js.
 * Can create mutations, actions and getters. See ModuleBuilder in this file for an use case;
 *
 * @type {Object}
 *
 * @property {Object} state - Module state
 * @property {string} name  - Module name
 * @property {function} mutations  - Module mutations
 * @property {function} actions  - Module actions
 * @property {function} getters  - Module getters
 */
export default {
  /**
   * Module's initial state
   * @type {Object}
   */
  state: {},
  /**
   * Generate mutations
   *
   * @param {string} singularModuleName - Module name, singular form
   *
   * @return {Object}
   */
  mutations: function mutations(singularModuleName) {
    var pluralModuleName = Modeler.plural(singularModuleName);
    var upperSingularName = singularModuleName.toUpperCase();
    var upperPluralName = pluralModuleName.toUpperCase();
    var mutations = {};
    /**
     * Replace state with new data
     *
     * @param {Object} state - Module's state
     */
    mutations['RESET_' + upperPluralName] = function (state) {
      for (var el in state) {
        if (state.hasOwnProperty(el)) {
          Vue.delete(state, el);
        }
      }
    };
    /**
     * Add one element to the state
     *
     * @param {Object} state  - Module's state
     * @param {Object} entity - New entity
     */
    mutations['SET_' + upperSingularName] = function (state, entity) {
      // console.log(`SET_${upperSingularName}`, entity);
      if (cm.objHasKey(entity, 'id')) {
        Vue.set(state, entity.id, patchStructure(entity, singularModuleName));
        // } else {
        //   console.error(
        //     `Trying to SET_${upperSingularName} with an entity without an id. Skipping.`,
        //     entity,
        //   );
      }
    };

    /**
     * Deletes one element from the state
     *
     * @param {Object} state - Module's state
     * @param {string} id    - Entity's id
     */
    mutations['DEL_' + upperSingularName] = function (state, id) {
      // console.log(`DEL_${upperSingularName}`, entity);
      Vue.delete(state, id);
    };

    /**
     * Updates an entity with new values. Use with caution, this can lead to
     * data inconsistencies.
     *
     * @param {Object} state  - Module's state
     * @param {Object} entity - New entity
     */
    mutations['UPDATE_' + upperSingularName] = function (state, entity) {
      Vue.set(state, entity.id, _extends({}, state[entity.id], entity));
    };

    return mutations;
  },


  /**
   * Generate actions
   *
   * @param singularModuleName
   * @param apiEndpoint
   * @param editable
   *
   * @return {Promise}
   */
  actions: function actions(singularModuleName, apiEndpoint, editable) {
    var pluralModuleName = Modeler.plural(singularModuleName);
    var upperSingularName = singularModuleName.toUpperCase();
    var upperPluralName = pluralModuleName.toUpperCase();
    var actions = {};

    /**
     * Dispatch relations in other modules then commits clean entity to store.
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     * @param {Object} entity     - Entity
     *
     * @return {Promise}
     */
    actions['DISPATCH_AND_COMMIT_' + upperSingularName] = function (_ref, entity) {
      var dispatch = _ref.dispatch,
          commit = _ref.commit;

      // console.log(`DISPATCH_AND_COMMIT_${upperSingularName}`);
      dispatchRelations(dispatch, entity, singularModuleName).then(function (cleanEntity) {
        // console.log('received', cleanEntity);
        commit('SET_' + upperSingularName, cleanEntity);
      });
    };

    /**
     * Actions that need a endpoint are set here
     */
    if (apiEndpoint) {
      /**
       * Loads all the elements
       *
       * @param {Function} dispatch - Dispatch method from VueX
       * @param {Function} commit   - Commit method from VueX
       * @param {Object}   config   - Payload configuration
       *
       * @return {Promise}
       */
      actions['LOAD_' + upperPluralName] = function (_ref2) {
        var dispatch = _ref2.dispatch,
            commit = _ref2.commit;
        var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        // Default config
        var defaults = {
          localLoader: false,
          loaderId: null,
          loaderMessage: null,
          endpoint: null,
          id: null, // Potential id for category filtering
          payload: null,
          page: null
          // Merging defaults with config parameter
        };var options = _Object$assign({}, defaults, config);

        // Endpoint
        var endpoint = apiEndpoint;
        if (options.endpoint) {
          endpoint = apiEndpoint + '/' + options.endpoint;
        } else {
          endpoint = apiEndpoint + '/';
        }
        if (options.id) {
          endpoint = endpoint + '/' + options.id;
        }

        /*
         Test and handle local loaders
         */
        var loader = setLoaderMessage(options, 'Chargement ' + Modeler.locale.ofMany[pluralModuleName] + '...', 'LOAD_' + upperPluralName + '_' + cm.randomChar());

        if (!Modeler.locale.ofMany[pluralModuleName]) {
          console.warn('No plural model name for ' + pluralModuleName);
        }

        // Do the call and set the loading state
        return api.get(endpoint, options.payload, loader).then(function (data) {
          // Dispatch data and relations to the corresponding modules
          console.log('received ' + pluralModuleName, data);

          var _loop = function _loop(i) {
            dispatch('DISPATCH_AND_COMMIT_' + upperSingularName, data[i], singularModuleName).then().then(function () {
              commit('SET_' + upperSingularName, data[i]);
            });
          };

          for (var i = 0; i < data.length; i++) {
            _loop(i);
          }
          return _Promise.resolve('LOAD_' + upperPluralName + ' finished');
        }).catch(function (err) {
          console.error('Error for LOAD_' + upperPluralName, err);
          Notifier.notify({
            text: messages.failedToGet,
            type: 'error'
          });
          return _Promise.reject(err);
        });
      };

      /**
       * Load one element
       *
       * @param {Function} dispatch - Dispatch method from VueX
       * @param {Function} commit   - Commit method from VueX
       * @param {Object}   config   - Payload configuration
       *
       * @return {Promise}
       */
      actions['LOAD_' + upperSingularName] = function (_ref3) {
        var dispatch = _ref3.dispatch,
            commit = _ref3.commit;
        var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var options = {};
        var id = null;
        // Default config
        var defaults = {
          localLoader: false,
          loaderId: null,
          loaderMessage: null,
          id: null,
          payload: null
          // Merging defaults with config parameter
          // If config is not an object it's the id.
        };if (config !== null && (typeof config === 'undefined' ? 'undefined' : _typeof(config)) === 'object') {
          options = _Object$assign({}, defaults, config);
          id = options.id;
        } else {
          options = defaults;
          id = config;
        }

        /*
         Test and handle local loaders
         */
        var loader = setLoaderMessage(options, 'Chargement ' + Modeler.locale.ofOne[singularModuleName] + '...', 'LOAD_' + upperPluralName);
        if (!Modeler.locale.ofOne[singularModuleName]) {
          console.warn('No singular model name for ' + singularModuleName);
        }

        return api.get(apiEndpoint + '/' + id, null, loader).then(function (data) {
          dispatch('DISPATCH_AND_COMMIT_' + upperSingularName, data, singularModuleName).then().then(function () {
            commit('SET_' + upperSingularName, data);
          });
          return _Promise.resolve('LOAD_' + upperSingularName + ' finished');
        }).catch(function (err) {
          console.error('Error for LOAD_' + upperSingularName, err);
          Notifier.notify({
            text: messages.failedToGet,
            type: 'error'
          });
          return _Promise.reject(err);
        });
      };
      if (editable === true) {
        /**
         * Create one element
         *
         * @param {Function} dispatch - Dispatch method from VueX
         * @param {Function} commit   - Commit method from VueX
         * @param {Object}   config   - Payload configuration
         *
         * @return {Promise}
         */
        actions['NEW_' + upperSingularName] = function (_ref4, config) {
          var dispatch = _ref4.dispatch,
              commit = _ref4.commit;

          // Options
          var options = {};
          var entity = {};
          var defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null

            // Merging defaults with config parameter
            // If config don't have an entity property, that's because it's the entity.
          };if (config.entity) {
            // console.log('special payload !', options.entity)
            options = _Object$assign({}, defaults, config);
            entity = options.entity;
          } else {
            // console.log('no special payload')
            options = defaults;
            entity = config;
          }

          // Stripping some fields
          var keys = ['id', 'user_id', 'created', 'modified', 'trashed'];
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _getIterator(keys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var k = _step.value;

              if (cm.objHasKey(entity, k)) {
                delete entity[k];
              }
            }

            /*
             Test and handle local loaders
             */
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          var loader = setLoaderMessage(options, 'Sauvegarde ' + Modeler.names.singulars[singularModuleName], 'NEW_' + upperSingularName);

          return api.post(apiEndpoint + '/create', entity, loader).then(function (data) {
            // console.log(`NEW_${upperSingularName}`, data)
            dispatch('DISPATCH_AND_COMMIT_' + upperSingularName, data, singularModuleName).then().then(function () {
              commit('SET_' + upperSingularName, data);
            });
            Notifier.notify({ text: messages.successOnCreate, type: 'success' });
            return _Promise.resolve(data);
          }).catch(function (err) {
            // console.error(`Error for NEW_${upperSingularName}`, err);
            Notifier.notify({
              text: messages.failedToCreate,
              type: 'error'
            });
            return _Promise.reject(err);
          });
        };

        /**
         * Patch one element
         *
         * @param {Function} dispatch - Dispatch method from VueX
         * @param {Function} commit   - Commit method from VueX
         * @param {Object}   config   - Payload configuration
         *
         * @return {Promise}
         */
        actions['PATCH_' + upperSingularName] = function (_ref5, config) {
          var dispatch = _ref5.dispatch,
              commit = _ref5.commit;

          // Options
          var options = {};
          var entity = {};
          var defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null

            // Merging defaults with config parameter
            // If config don't have an entity property, that's because it's the entity.
          };if (config.entity) {
            // console.log('special payload !', options.entity)
            options = _Object$assign({}, defaults, config);
            entity = options.entity;
          } else {
            // console.log('no special payload')
            options = defaults;
            entity = config;
          }

          var entityId = Object.prototype.toString.call(entity) === '[object FormData]' ? entity.get('id') : entity.id;

          // Stripping some fields:
          var keys = ['user_id', 'created', 'modified'];
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = _getIterator(keys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var k = _step2.value;

              if (cm.objHasKey(entity, k)) {
                delete entity[k];
              }
            }

            // Test and handle local loaders
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          var loader = setLoaderMessage(options, 'Sauvegarde ' + Modeler.names.singulars[singularModuleName], 'PATCH_' + upperSingularName);

          return api.patch(apiEndpoint + '/' + entityId, entity, loader).then(function (data) {
            // Disabled for now as the API returns an empty response.
            dispatch('DISPATCH_AND_COMMIT_' + upperSingularName, data, singularModuleName).then().then(function () {
              commit('SET_' + upperSingularName, data);
            });
            Notifier.notify({ text: messages.successOnPatch, type: 'success' });
            return _Promise.resolve(data);
          }).catch(function (err) {
            // console.error(`Error for PATCH_${upperSingularName}`, err);
            Notifier.notify({
              text: messages.failedToPatch,
              type: 'error'
            });
            return _Promise.reject(err);
          });
        };

        /**
         * Deletes one element
         *
         * @param {Function} dispatch - Dispatch method from VueX
         * @param {Function} commit   - Commit method from VueX
         * @param {Object}   config   - Payload configuration
         *
         * @return {Promise}
         */
        actions['DELETE_' + upperSingularName] = function (_ref6, config) {
          var dispatch = _ref6.dispatch,
              commit = _ref6.commit;

          // Options
          var options = {};
          var id = null;
          var defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null

            // Merging defaults with config parameter
            // If config don't have an entity property, that's because it's the entity.
          };if (config.entity) {
            options = _Object$assign({}, defaults, config);
            id = options.id;
          } else {
            options = defaults;
            id = config;
          }

          /*
           Test and handle local loaders
           */
          var loader = setLoaderMessage(options, 'Deleting ' + Modeler.names.singulars[singularModuleName], 'DELETE_' + upperSingularName);

          return api.delete(apiEndpoint + '/delete/' + id, null, loader).then(function (data) {
            commit('DEL_' + upperSingularName, id);
            Notifier.notify({
              text: messages.successOnDelete,
              type: 'success'
            });
            return _Promise.resolve(data);
          }).catch(function (err) {
            // console.error('ERROR for DELETE_RELATION', err);
            Notifier.notify({
              text: messages.failedOnDelete,
              type: 'error'
            });
            return _Promise.reject(err);
          });
        };
      } else {
        actions['NEW_' + upperSingularName] = function () {
          return notAvailable('NEW_' + upperSingularName + ' is not available for this module.');
        };
        actions['PATCH_' + upperSingularName] = function () {
          return notAvailable('PATCH_' + upperSingularName + ' is not available for this module.');
        };
        actions['DELETE_' + upperSingularName] = function () {
          return notAvailable('DELETE_' + upperSingularName + ' is not available for this module.');
        };
      }
    } else {
      actions['LOAD_' + upperPluralName] = function () {
        return notAvailable('LOAD_' + upperPluralName + ': No endpoint defined.');
      };
      actions['LOAD_' + upperSingularName] = function () {
        return notAvailable('LOAD_' + upperSingularName + ': No endpoint defined.');
      };
      actions['NEW_' + upperSingularName] = function () {
        return notAvailable('NEW_' + upperSingularName + ': No endpoint defined.');
      };
      actions['PATCH_' + upperSingularName] = function () {
        return notAvailable('PATCH_' + upperSingularName + ': No endpoint defined.');
      };
      actions['DELETE_' + upperSingularName] = function () {
        return notAvailable('DELETE_' + upperSingularName + ': No endpoint defined.');
      };
    }

    /**
     * Empties the module
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     */
    actions['RESET_' + upperPluralName + '_STATE'] = function (_ref7) {
      var dispatch = _ref7.dispatch,
          commit = _ref7.commit;

      var d = dispatch('SET_LOADING_STATE', 'Nettoyage ' + Modeler.names.plurals[pluralModuleName]);
      d.then(function (r) {
        commit('RESET_' + upperPluralName);
        r.done();
      });
    };

    return actions;
  },


  /**
   * Generates getters
   * @param {string} singularModuleName - Module name, singular
   *
   * @return {Object}
   */
  getters: function getters(singularModuleName) {
    var upperSingularName = singularModuleName.toUpperCase();
    var pluralModuleName = Modeler.plural(singularModuleName);
    var upperPluralName = pluralModuleName.toUpperCase();
    var getters = {};

    /**
     * Returns all the current module state
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters['ALL_' + upperPluralName] = function (state) {
      return state || {};
    };
    /**
     * Returns one element by Id.
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters['ONE_' + upperSingularName] = function (state) {
      return function (id) {
        return state[id] || {};
      };
    };
    /**
     * Get elements by relation id and name
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters['ALL_' + upperPluralName + '_BY_RELATION'] = function (state) {
      return function (foreignKey, foreignId) {
        return cm.filterObj(state, function (element) {
          return element[foreignKey] === foreignId;
        }) || {};
      };
    };
    getters['ALL_' + upperPluralName + '_BY_HABTM_RELATION'] = function (state) {
      return function (foreignKey, foreignId) {
        return cm.filterObj(state, function (element) {
          return element[foreignKey].indexOf(foreignId) > -1;
        }) || {};
      };
    };

    /**
     * Callback used in the ALL_<xxx>_BY_FILTER.
     * This callback should return true on elements to keep.
     * @function ALL_BY_FILTER_CALLBACK
     * @param {Object} element - Current entity
     * @return  {bool}
     */
    /**
     * @param state
     *
     * @param {ALL_BY_FILTER_CALLBACK} callback - The callback
     */
    getters['ALL_' + upperPluralName + '_BY_FILTER'] = function (state) {
      return function (callback) {
        return cm.filterObj(state, function (element) {
          return callback(element);
        }) || {};
      };
    };
    /**
     * Get the first element by relation id an name
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters['FIRST_' + upperSingularName + '_BY_RELATION'] = function (state) {
      return function (foreignKey, foreignId) {
        return cm.filterObj(state, function (element) {
          return element[foreignKey] === foreignId;
        }, true) || {};
      };
    };

    /**
     * Count elements in the store
     *
     * @param {Object} state - Current module state
     *
     * @return {number}
     */
    getters['COUNT_' + upperPluralName] = function (state) {
      return _Object$keys(state).length;
    };

    /**
     * Count elements for a given relation
     *
     * @param {Object} state - Current module state
     *
     * @return {number}
     */
    getters['COUNT_' + upperPluralName + '_IN_RELATION'] = function (state) {
      return function (foreignKey, foreignId) {
        return _Object$keys(cm.filterObj(state, function (element) {
          return element[foreignKey] === foreignId;
        })).length;
      };
    };

    /**
     * Return a list ordered by a given field
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters['ALL_' + upperPluralName + '_LIST_ORDERED_BY_TEXT_FIELD'] = function (state) {
      return function (fieldName) {
        return cm.sortResultsByText(state, fieldName) || {};
      };
    };

    /**
     * Return the default model structure
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[upperSingularName + '_MODEL'] = function () {
      return Modeler.fields(singularModuleName) || {};
    };

    return getters;
  }
};