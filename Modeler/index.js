/**
 * Model list with their configuration
 * @type {Object}
 */
export const models = {}
/**
 * Singulars/plural correspondences
 * @type {Object}
 *
 * @property {Object} singulars - Singular -> plural correspondences
 * @property {Object} plurals   - Plural -> Singular correspondences
 */
export const names = {
  singulars: {},
  plurals: {}
}

/**
 * NOT YET INTERNATIONALIZABLE, it's only a prototype.
 * @type {{ofOne: string, ofMany: string}}
 */
export const locale = {
  ofOne: {},
  ofMany: {}
}

/**
 * Generates a model
 * @param singular
 * @param plural
 * @param fields
 * @param relations
 */
export const generate = (singular, plural, fields = {}, relations = {}, localeTerms = {}) => {
  names.singulars[plural] = singular
  names.plurals[singular] = plural
  locale.ofMany[plural] = localeTerms.ofMany || plural
  locale.ofOne[singular] = localeTerms.ofOne || `a ${singular}`
  models[singular] = {
    fields,
    relations: {
      many: relations.many || [],
      one: relations.one || [],
      habtm: relations.habtm || []
    }
  }
}

/**
 * Returns complete relations from model definition.
 *
 * @param {string} name - Singular model name
 *
 * @return {Object}
 */
export const relations = name => models[name].relations

/**
 * Returns the plural form of a singular name from `names` var, or adds an 's'...
 *
 * @param {string} name - Singular model name
 *
 * @return {string}
 */
export const plural = (name) => {
  if (names.plurals[name]) {
    // console.log(`Plural found for ${name}`);
    return names.plurals[name]
  }
  console.error(`Plural not found for ${name}, falling back`)
  return `${name}s`
}

/**
 * Returns the singular form of a plural name from `names` var or removes the last char.
 *
 * @param {string} name - Plural model name
 *
 * @return {string}
 */
export const singular = (name) => {
  if (names.singulars[name]) {
    // console.log(`Singular found for ${name}`);
    return names.singulars[name]
  }
  console.error(`Singular not found for ${name}, falling back.`)
  return name.slice(0, name.length - 1)
}

export const fields = (model) => models[model].fields

export default {models, names, locale, generate, fields, relations, plural, singular}
