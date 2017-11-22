/**
 * Creates mutations, actions and getters for models
 *
 * @author Manuel Tancoigne <m.tancoigne@gmail.com>
 * @copyright MIT license
 */
import Vue from 'vue'
import api from '../Api'
import Modeler from '../Modeler'
import cm from '../Common'
import Notifier from '../Notifier'
// Modulator-related files
import messages from './locale/en'
import { notAvailable, patchStructure, dispatchRelations, setLoaderMessage } from './functions'

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
  mutations (singularModuleName) {
    const pluralModuleName = Modeler.plural(singularModuleName)
    const upperSingularName = singularModuleName.toUpperCase()
    const upperPluralName = pluralModuleName.toUpperCase()
    const mutations = {}
    /**
     * Replace state with new data
     *
     * @param {Object} state - Module's state
     */
    mutations[`RESET_${upperPluralName}`] = (state) => {
      for (const el in state) {
        if (state.hasOwnProperty(el)) {
          Vue.delete(state, el)
        }
      }
    }
    /**
     * Add one element to the state
     *
     * @param {Object} state  - Module's state
     * @param {Object} entity - New entity
     */
    mutations[`SET_${upperSingularName}`] = (state, entity) => {
      // console.log(`SET_${upperSingularName}`, entity);
      if (cm.objHasKey(entity, 'id')) {
        Vue.set(state, entity.id, patchStructure(entity, singularModuleName))
        // } else {
        //   console.error(
        //     `Trying to SET_${upperSingularName} with an entity without an id. Skipping.`,
        //     entity,
        //   );
      }
    }

    /**
     * Deletes one element from the state
     *
     * @param {Object} state - Module's state
     * @param {string} id    - Entity's id
     */
    mutations[`DEL_${upperSingularName}`] = (state, id) => {
      // console.log(`DEL_${upperSingularName}`, entity);
      Vue.delete(state, id)
    }

    /**
     * Updates an entity with new values. Use with caution, this can lead to
     * data inconsistencies.
     *
     * @param {Object} state  - Module's state
     * @param {Object} entity - New entity
     */
    mutations[`UPDATE_${upperSingularName}`] = (state, entity) => {
      Vue.set(state, entity.id, {
        ...state[entity.id],
        ...entity
      })
    }

    return mutations
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
  actions (singularModuleName, apiEndpoint, editable) {
    const pluralModuleName = Modeler.plural(singularModuleName)
    const upperSingularName = singularModuleName.toUpperCase()
    const upperPluralName = pluralModuleName.toUpperCase()
    const actions = {}

    /**
     * Dispatch relations in other modules then commits clean entity to store.
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     * @param {Object} entity     - Entity
     *
     * @return {Promise}
     */
    actions[`DISPATCH_AND_COMMIT_${upperSingularName}`] = ({dispatch, commit}, entity) => {
      // console.log(`DISPATCH_AND_COMMIT_${upperSingularName}`);
      dispatchRelations(dispatch, entity, singularModuleName)
        .then((cleanEntity) => {
          // console.log('received', cleanEntity);
          commit(`SET_${upperSingularName}`, cleanEntity)
        })
    }

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
      actions[`LOAD_${upperPluralName}`] = ({dispatch, commit}, config = {}) => {
        // Default config
        const defaults = {
          localLoader: false,
          loaderId: null,
          loaderMessage: null,
          endpoint: null,
          id: null, // Potential id for category filtering
          payload: null,
          page: null
        }
        // Merging defaults with config parameter
        const options = Object.assign({}, defaults, config)

        // Endpoint
        let endpoint = apiEndpoint
        if (options.endpoint) {
          endpoint = `${apiEndpoint}/${options.endpoint}`
        } else {
          endpoint = `${apiEndpoint}/`
        }
        if (options.id) {
          endpoint = `${endpoint}/${options.id}`
        }

        /*
         Test and handle local loaders
         */
        const loader = setLoaderMessage(
          options,
          `Chargement ${Modeler.locale.ofMany[pluralModuleName]}...`,
          `LOAD_${upperPluralName}_${cm.randomChar()}`
        )

        if (!Modeler.locale.ofMany[pluralModuleName]) {
          console.warn(`No plural model name for ${pluralModuleName}`)
        }

        // Do the call and set the loading state
        return api.get(endpoint, options.payload, loader)
          .then((data) => {
            // Dispatch data and relations to the corresponding modules
            console.log(`received ${pluralModuleName}`, data)
            for (let i = 0; i < data.length; i++) {
              dispatch(`DISPATCH_AND_COMMIT_${upperSingularName}`, data[i], singularModuleName).then().then(() => {
                commit(`SET_${upperSingularName}`, data[i])
              })
            }
            return Promise.resolve(`LOAD_${upperPluralName} finished`)
          })
          .catch((err) => {
            console.error(`Error for LOAD_${upperPluralName}`, err)
            Notifier.notify({
              text: messages.failedToGet,
              type: 'error'
            })
            return Promise.reject(err)
          })
      }

      /**
       * Load one element
       *
       * @param {Function} dispatch - Dispatch method from VueX
       * @param {Function} commit   - Commit method from VueX
       * @param {Object}   config   - Payload configuration
       *
       * @return {Promise}
       */
      actions[`LOAD_${upperSingularName}`] = ({dispatch, commit}, config = null) => {
        let options = {}
        let id = null
        // Default config
        const defaults = {
          localLoader: false,
          loaderId: null,
          loaderMessage: null,
          id: null,
          payload: null
        }
        // Merging defaults with config parameter
        // If config is not an object it's the id.
        if (config !== null && typeof config === 'object') {
          options = Object.assign({}, defaults, config)
          id = options.id
        } else {
          options = defaults
          id = config
        }

        /*
         Test and handle local loaders
         */
        const loader = setLoaderMessage(
          options,
          `Chargement ${Modeler.locale.ofOne[singularModuleName]}...`,
          `LOAD_${upperPluralName}`
        )
        if (!Modeler.locale.ofOne[singularModuleName]) {
          console.warn(`No singular model name for ${singularModuleName}`)
        }

        return api.get(`${apiEndpoint}/${id}`, null, loader)
          .then((data) => {
            dispatch(`DISPATCH_AND_COMMIT_${upperSingularName}`, data, singularModuleName).then().then(() => {
              commit(`SET_${upperSingularName}`, data)
            })
            return Promise.resolve(`LOAD_${upperSingularName} finished`)
          })
          .catch((err) => {
            console.error(`Error for LOAD_${upperSingularName}`, err)
            Notifier.notify({
              text: messages.failedToGet,
              type: 'error'
            })
            return Promise.reject(err)
          })
      }
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
        actions[`NEW_${upperSingularName}`] = ({dispatch, commit}, config) => {
          // Options
          let options = {}
          let entity = {}
          const defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null
          }

          // Merging defaults with config parameter
          // If config don't have an entity property, that's because it's the entity.
          if (config.entity) {
            // console.log('special payload !', options.entity)
            options = Object.assign({}, defaults, config)
            entity = options.entity
          } else {
            // console.log('no special payload')
            options = defaults
            entity = config
          }

          // Stripping some fields
          const keys = ['id', 'user_id', 'created', 'modified', 'trashed']
          for (const k of keys) {
            if (cm.objHasKey(entity, k)) {
              delete entity[k]
            }
          }

          /*
           Test and handle local loaders
           */
          const loader = setLoaderMessage(
            options,
            `Sauvegarde ${Modeler.names.singulars[singularModuleName]}`,
            `NEW_${upperSingularName}`
          )

          return api.post(`${apiEndpoint}/create`, entity, loader)
            .then((data) => {
              // console.log(`NEW_${upperSingularName}`, data)
              dispatch(`DISPATCH_AND_COMMIT_${upperSingularName}`, data, singularModuleName).then().then(() => {
                commit(`SET_${upperSingularName}`, data)
              })
              Notifier.notify({text: messages.successOnCreate, type: 'success'})
              return Promise.resolve(data)
            })
            .catch((err) => {
              // console.error(`Error for NEW_${upperSingularName}`, err);
              Notifier.notify({
                text: messages.failedToCreate,
                type: 'error'
              })
              return Promise.reject(err)
            })
        }

        /**
         * Patch one element
         *
         * @param {Function} dispatch - Dispatch method from VueX
         * @param {Function} commit   - Commit method from VueX
         * @param {Object}   config   - Payload configuration
         *
         * @return {Promise}
         */
        actions[`PATCH_${upperSingularName}`] = ({dispatch, commit}, config) => {
          // Options
          let options = {}
          let entity = {}
          const defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null
          }

          // Merging defaults with config parameter
          // If config don't have an entity property, that's because it's the entity.
          if (config.entity) {
            // console.log('special payload !', options.entity)
            options = Object.assign({}, defaults, config)
            entity = options.entity
          } else {
            // console.log('no special payload')
            options = defaults
            entity = config
          }

          const entityId = Object.prototype.toString.call(entity) === '[object FormData]'
            ? entity.get('id')
            : entity.id

          // Stripping some fields:
          const keys = ['user_id', 'created', 'modified']
          for (const k of keys) {
            if (cm.objHasKey(entity, k)) {
              delete entity[k]
            }
          }

          // Test and handle local loaders
          const loader = setLoaderMessage(
            options,
            `Sauvegarde ${Modeler.names.singulars[singularModuleName]}`,
            `PATCH_${upperSingularName}`
          )

          return api.patch(`${apiEndpoint}/${entityId}`, entity, loader)
            .then((data) => {
              // Disabled for now as the API returns an empty response.
              dispatch(`DISPATCH_AND_COMMIT_${upperSingularName}`,
                data,
                singularModuleName)
                .then().then(() => {
                commit(`SET_${upperSingularName}`, data)
              })
              Notifier.notify({text: messages.successOnPatch, type: 'success'})
              return Promise.resolve(data)
            })
            .catch((err) => {
              // console.error(`Error for PATCH_${upperSingularName}`, err);
              Notifier.notify({
                text: messages.failedToPatch,
                type: 'error'
              })
              return Promise.reject(err)
            })
        }

        /**
         * Deletes one element
         *
         * @param {Function} dispatch - Dispatch method from VueX
         * @param {Function} commit   - Commit method from VueX
         * @param {Object}   config   - Payload configuration
         *
         * @return {Promise}
         */
        actions[`DELETE_${upperSingularName}`] = ({dispatch, commit}, config) => {
          // Options
          let options = {}
          let id = null
          const defaults = {
            localLoader: false,
            loaderId: null,
            loaderMessage: null,
            payload: null
          }

          // Merging defaults with config parameter
          // If config don't have an entity property, that's because it's the entity.
          if (config.entity) {
            options = Object.assign({}, defaults, config)
            id = options.id
          } else {
            options = defaults
            id = config
          }

          /*
           Test and handle local loaders
           */
          const loader = setLoaderMessage(
            options,
            `Deleting ${Modeler.names.singulars[singularModuleName]}`,
            `DELETE_${upperSingularName}`
          )

          return api.delete(`${apiEndpoint}/delete/${id}`, null, loader)
            .then((data) => {
              commit(`DEL_${upperSingularName}`, id)
              Notifier.notify({
                text: messages.successOnDelete,
                type: 'success'
              })
              return Promise.resolve(data)
            })
            .catch((err) => {
              // console.error('ERROR for DELETE_RELATION', err);
              Notifier.notify({
                text: messages.failedOnDelete,
                type: 'error'
              })
              return Promise.reject(err)
            })
        }
      } else {
        actions[`NEW_${upperSingularName}`] = () => notAvailable(`NEW_${upperSingularName} is not available for this module.`)
        actions[`PATCH_${upperSingularName}`] = () => notAvailable(`PATCH_${upperSingularName} is not available for this module.`)
        actions[`DELETE_${upperSingularName}`] = () => notAvailable(`DELETE_${upperSingularName} is not available for this module.`)
      }
    } else {
      actions[`LOAD_${upperPluralName}`] = () => notAvailable(`LOAD_${upperPluralName}: No endpoint defined.`)
      actions[`LOAD_${upperSingularName}`] = () => notAvailable(`LOAD_${upperSingularName}: No endpoint defined.`)
      actions[`NEW_${upperSingularName}`] = () => notAvailable(`NEW_${upperSingularName}: No endpoint defined.`)
      actions[`PATCH_${upperSingularName}`] = () => notAvailable(`PATCH_${upperSingularName}: No endpoint defined.`)
      actions[`DELETE_${upperSingularName}`] = () => notAvailable(`DELETE_${upperSingularName}: No endpoint defined.`)
    }

    /**
     * Empties the module
     *
     * @param {Function} dispatch - Dispatch method from VueX
     * @param {Function} commit   - Commit method from VueX
     */
    actions[`RESET_${upperPluralName}_STATE`] = ({dispatch, commit}) => {
      const d = dispatch('SET_LOADING_STATE', `Nettoyage ${Modeler.names.plurals[pluralModuleName]}`)
      d.then(
        (r) => {
          commit(`RESET_${upperPluralName}`)
          r.done()
        })
    }

    return actions
  },

  /**
   * Generates getters
   * @param {string} singularModuleName - Module name, singular
   *
   * @return {Object}
   */
  getters (singularModuleName) {
    const upperSingularName = singularModuleName.toUpperCase()
    const pluralModuleName = Modeler.plural(singularModuleName)
    const upperPluralName = pluralModuleName.toUpperCase()
    const getters = {}

    /**
     * Returns all the current module state
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`ALL_${upperPluralName}`] = state => state || {}
    /**
     * Returns one element by Id.
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`ONE_${upperSingularName}`] = state => id => state[id] || {}
    /**
     * Get elements by relation id and name
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`ALL_${upperPluralName}_BY_RELATION`] = state => (foreignKey, foreignId) => cm.filterObj(state, element => element[foreignKey] === foreignId) || {}
    getters[`ALL_${upperPluralName}_BY_HABTM_RELATION`] = state => (foreignKey, foreignId) => cm.filterObj(state, element => element[foreignKey].indexOf(foreignId) > -1) || {}

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
    getters[`ALL_${upperPluralName}_BY_FILTER`] = state => (callback) => cm.filterObj(state, element => callback(element)) || {}
    /**
     * Get the first element by relation id an name
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`FIRST_${upperSingularName}_BY_RELATION`] = state => (foreignKey, foreignId) => cm.filterObj(state, element => element[foreignKey] === foreignId, true) || {}

    /**
     * Count elements in the store
     *
     * @param {Object} state - Current module state
     *
     * @return {number}
     */
    getters[`COUNT_${upperPluralName}`] = state => Object.keys(state).length

    /**
     * Count elements for a given relation
     *
     * @param {Object} state - Current module state
     *
     * @return {number}
     */
    getters[`COUNT_${upperPluralName}_IN_RELATION`] = state => (foreignKey, foreignId) => Object.keys(cm.filterObj(state, element => element[foreignKey] === foreignId)).length

    /**
     * Return a list ordered by a given field
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`ALL_${upperPluralName}_LIST_ORDERED_BY_TEXT_FIELD`] = state => fieldName => cm.sortResultsByText(state, fieldName) || {}

    /**
     * Return the default model structure
     *
     * @param {Object} state - Current module state
     *
     * @return {Object}
     */
    getters[`${upperSingularName}_MODEL`] = () => Modeler.fields(singularModuleName) || {}

    return getters
  }
}
