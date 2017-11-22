import Modulator from './modulator'

/**
 * Builds a VueX module with basic getters/setters
 *
 * @param {string}  singularModuleName - Module name, singular form
 * @param {string}  apiEndpoint        - Api endpoint, relative to the API base url
 * @param {boolean} editable           - If false, the actions to edit/create/delete won't be created.
 */
export default (singularModuleName, apiEndpoint, editable = true) => (
  {
    state: {},
    mutations: {
      ...Modulator.mutations(singularModuleName)
    },
    actions: {
      ...Modulator.actions(singularModuleName, apiEndpoint, editable)
    },
    getters: {
      ...Modulator.getters(singularModuleName)
    }
  }
)
