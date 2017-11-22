import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Promise from 'babel-runtime/core-js/promise';
import cm from '../Common';
import Modeler from '../Modeler';

/**
 * Returns a message when a method has not been loaded in the modulator
 * @param message
 * @returns {Promise}
 */
export var notAvailable = function notAvailable(message) {
  console.warn(message);
  return _Promise.reject(new Error('Method not available'));
};

/**
 * Patches a given entity with its defaults to complete incomplete entities from api
 *
 * @param {Object} origin            - Original entity
 * @param {string} pluralModuleName  - Module name to fetch the defaults from (must be plural name)
 *
 * @return {Object} Patched object
 */
export var patchStructure = function patchStructure(origin, pluralModuleName) {
  return _Object$assign({}, Modeler.fields(pluralModuleName), origin);
};

/**
 * Checks an entity and dispatches the relations in their appropriate modules.
 *
 * @param {function} dispatch          - Dispatch method from VueX
 * @param {object}   entity            - Entity to process
 * @param {string}   currentModuleName - Current module name
 *
 * @return Promise
 */
export var dispatchRelations = function dispatchRelations(dispatch, entity, currentModuleName) {
  return new _Promise(function (resolve) {
    // console.log('Dispatching', { dispatch, entity, currentModuleName });
    var relations = Modeler.relations(currentModuleName);
    var fieldName = '';
    var modelName = '';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _getIterator(relations.many), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var rel = _step.value;

        // console.log(`Many entities: ${rel}`);
        // Case where the relation is special
        if (cm.isObj(rel)) {
          fieldName = rel.field;
          modelName = rel.model;
        } else {
          fieldName = rel;
          modelName = rel;
        }
        if (cm.objHasKey(entity, fieldName)) {
          var singularRelationName = Modeler.singular(modelName);
          for (var subEntity in entity[fieldName]) {
            if (entity[fieldName].hasOwnProperty(subEntity)) {
              // Prevent dispatching entities with no Ids
              if (entity[fieldName][subEntity].id) {
                dispatch('DISPATCH_AND_COMMIT_' + singularRelationName.toUpperCase(), entity[fieldName][subEntity]);
              }
            }
          }
          delete entity[fieldName];
        }
      }
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

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = _getIterator(relations.one), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _rel = _step2.value;

        // Case where the relation is special
        if (cm.isObj(_rel)) {
          fieldName = _rel.field;
          modelName = _rel.model;
        } else {
          fieldName = _rel;
          modelName = _rel;
        }
        // Prevent dispatching entities with no Ids
        if (cm.objHasKey(entity, fieldName) && entity[fieldName] !== null && entity[fieldName].id) {
          // console.log(`One entity: ${rel}`);
          dispatch('DISPATCH_AND_COMMIT_' + modelName.toUpperCase(), entity[fieldName]);
        }
        delete entity[fieldName];
      }
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

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = _getIterator(relations.habtm), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _rel2 = _step3.value;

        if (cm.objHasKey(entity, _rel2.name)) {
          var _fieldName = _rel2.name;
          var fkList = [];
          var _singularRelationName = Modeler.singular(_rel2.name);
          for (var _subEntity in entity[_fieldName]) {
            // Here we have a sub-object
            if (entity[_fieldName].hasOwnProperty(_subEntity)) {
              // Prevent dispatching entities with no Ids
              if (entity[_fieldName][_subEntity].id) {
                fkList.push(entity[_fieldName][_subEntity].id);
                dispatch('DISPATCH_AND_COMMIT_' + _singularRelationName.toUpperCase(), entity[_fieldName][_subEntity]);
              } else if (entity[_fieldName][_subEntity].fk_id) {
                fkList.push(entity[_fieldName][_subEntity].fk_id);
              } else {
                console.warning('I can\'t process this entity, please verify the answer', modelName, entity[_fieldName][_subEntity]);
                // fkList.push(entity[fieldName][subEntity])
              }
            }
          }
          entity[_fieldName] = fkList;
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    if (relations.habtm.length > 0) {
      delete entity._matchingData;
    }

    // console.log('Returning ', entity);
    resolve(entity);
  }, function (err) {
    console.error('ERROR IN dispatchRelations', err);
  });
};

/**
 * Returns a custom default message for the loaders
 *
 * @param {Object} options                             - Loader's options
 * @param {String} options.loaderMessage               - Loader's message
 * @param {boolean|string|Object} options.localLoader  - Loader's local loader config
 * @param {string} defaultMessage        - Default message
 * @param {number|string} defaultId      - Default id
 *
 * @returns {string}
 */
export var setLoaderMessage = function setLoaderMessage(options, defaultMessage, defaultId) {
  var message = options.loaderMessage || defaultMessage;
  if (options.localLoader === true) {
    return { loaderId: options.loaderId || defaultId, message: message };
  }
  return message;
};