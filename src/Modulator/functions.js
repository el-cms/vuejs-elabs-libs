import cm from '../Common'
import Modeler from '../Modeler'

/**
 * Returns a message when a method has not been loaded in the modulator
 * @param message
 * @returns {Promise}
 */
export const notAvailable = (message) => {
  console.warn(message)
  return Promise.reject(new Error('Method not available'))
}

/**
 * Patches a given entity with its defaults to complete incomplete entities from api
 *
 * @param {Object} origin            - Original entity
 * @param {string} pluralModuleName  - Module name to fetch the defaults from (must be plural name)
 *
 * @return {Object} Patched object
 */
export const patchStructure = (origin, pluralModuleName) => Object.assign(
  {},
  Modeler.fields(pluralModuleName),
  origin)

/**
 * Checks an entity and dispatches the relations in their appropriate modules.
 *
 * @param {function} dispatch          - Dispatch method from VueX
 * @param {object}   entity            - Entity to process
 * @param {string}   currentModuleName - Current module name
 *
 * @return Promise
 */
export const dispatchRelations = (dispatch, entity, currentModuleName) => new Promise(
  (resolve) => {
    // console.log('Dispatching', { dispatch, entity, currentModuleName });
    const relations = Modeler.relations(currentModuleName)
    let fieldName = ''
    let modelName = ''
    for (const rel of relations.many) {
      // console.log(`Many entities: ${rel}`);
      // Case where the relation is special
      if (cm.isObj(rel)) {
        fieldName = rel.field
        modelName = rel.model
      } else {
        fieldName = rel
        modelName = rel
      }
      if (cm.objHasKey(entity, fieldName)) {
        const singularRelationName = Modeler.singular(modelName)
        for (const subEntity in entity[fieldName]) {
          if (entity[fieldName].hasOwnProperty(subEntity)) {
            // Prevent dispatching entities with no Ids
            if (entity[fieldName][subEntity].id) {
              dispatch(`DISPATCH_AND_COMMIT_${singularRelationName.toUpperCase()}`, entity[fieldName][subEntity])
            }
          }
        }
        delete entity[fieldName]
      }
    }
    for (const rel of relations.one) {
      // Case where the relation is special
      if (cm.isObj(rel)) {
        fieldName = rel.field
        modelName = rel.model
      } else {
        fieldName = rel
        modelName = rel
      }
      // Prevent dispatching entities with no Ids
      if (cm.objHasKey(entity, fieldName) && entity[fieldName] !== null && entity[fieldName].id) {
        // console.log(`One entity: ${rel}`);
        dispatch(`DISPATCH_AND_COMMIT_${modelName.toUpperCase()}`, entity[fieldName])
      }
      delete entity[fieldName]
    }
    for (const rel of relations.habtm) {
      if (cm.objHasKey(entity, rel.name)) {
        const fieldName = rel.name
        const fkList = []
        const singularRelationName = Modeler.singular(rel.name)
        for (const subEntity in entity[fieldName]) {
          // Here we have a sub-object
          if (entity[fieldName].hasOwnProperty(subEntity)) {
            // Prevent dispatching entities with no Ids
            if (entity[fieldName][subEntity].id) {
              fkList.push(entity[fieldName][subEntity].id)
              dispatch(`DISPATCH_AND_COMMIT_${singularRelationName.toUpperCase()}`, entity[fieldName][subEntity])
            } else if (entity[fieldName][subEntity].fk_id) {
              fkList.push(entity[fieldName][subEntity].fk_id)
            } else {
              console.warning('I can\'t process this entity, please verify the answer', modelName, entity[fieldName][subEntity])
              // fkList.push(entity[fieldName][subEntity])
            }
          }
        }
        entity[fieldName] = fkList
      }
    }
    if (relations.habtm.length > 0) {
      delete entity._matchingData
    }

    // console.log('Returning ', entity);
    resolve(entity)
  },
  (err) => {
    console.error('ERROR IN dispatchRelations', err)
  })

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
export const setLoaderMessage = (options, defaultMessage, defaultId) => {
  const message = options.loaderMessage || defaultMessage
  if (options.localLoader === true) {
    return {loaderId: options.loaderId || defaultId, message}
  }
  return message
}
