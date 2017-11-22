import Vue from 'vue'
import Vuex from 'vuex'
// VueX custom Modules
import PageStateModule from './VueX/PageStateModule'
import LoadersModule from './VueX/LoadersModule'
// Initialization
Vue.use(Vuex)

/**
 * VueX Store configuration
 *
 * @module
 *
 * @type {object}
 *
 * @property {Object} state - VueX state
 * @property {Object} mutations - VueX mutations
 * @property {Object} actions - VueX actions
 * @property {Object} getters - VueX getters
 */
export const Store = new Vuex.Store({
  /**
   * VueX State
   *
   * @type {object}
   */
  state: {},
  /**
   * VueX mutations
   *
   * @type {Object}
   */
  mutations: {},
  /**
   * VueX Actions
   *
   * @type {Object}
   */
  actions: {},
  /**
   * VueX getters
   *
   * @type {Object}
   */
  getters: {},
  /**
   * VueX modules
   *
   * @type {Object}
   */
  modules: {
    loaders: LoadersModule,
    page_state: PageStateModule
    // users: ModuleBuilder('user', 'users')
    // toast: createModule({
    //  dismissInterval: 5000
    // })
  }
})
export function generateModule (moduleName, apiEndpoint, editable = true) {
  Store.registerModule(moduleName, ModuleBuilder(moduleName, apiEndpoint, editable))
}
