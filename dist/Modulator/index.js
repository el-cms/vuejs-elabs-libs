import _extends from 'babel-runtime/helpers/extends';
import Modulator from './modulator';

/**
 * Builds a VueX module with basic getters/setters
 *
 * @param {string}  singularModuleName - Module name, singular form
 * @param {string}  apiEndpoint        - Api endpoint, relative to the API base url
 * @param {boolean} editable           - If false, the actions to edit/create/delete won't be created.
 */
export default (function (singularModuleName, apiEndpoint) {
  var editable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  return {
    state: {},
    mutations: _extends({}, Modulator.mutations(singularModuleName)),
    actions: _extends({}, Modulator.actions(singularModuleName, apiEndpoint, editable)),
    getters: _extends({}, Modulator.getters(singularModuleName))
  };
});