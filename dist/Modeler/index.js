/**
 * Model list with their configuration
 * @type {Object}
 */
export var models = {};
/**
 * Singulars/plural correspondences
 * @type {Object}
 *
 * @property {Object} singulars - Singular -> plural correspondences
 * @property {Object} plurals   - Plural -> Singular correspondences
 */
export var names = {
  singulars: {},
  plurals: {}

  /**
   * NOT YET INTERNATIONALIZABLE, it's only a prototype.
   * @type {{ofOne: string, ofMany: string}}
   */
};export var locale = {
  ofOne: {},
  ofMany: {}

  /**
   * Generates a model
   * @param singular
   * @param plural
   * @param fields
   * @param relations
   */
};export var generate = function generate(singular, plural) {
  var fields = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var relations = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var localeTerms = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  names.singulars[plural] = singular;
  names.plurals[singular] = plural;
  locale.ofMany[plural] = localeTerms.ofMany || plural;
  locale.ofOne[singular] = localeTerms.ofOne || "a " + singular;
  models[singular] = {
    fields: fields,
    relations: {
      many: relations.many || [],
      one: relations.one || [],
      habtm: relations.habtm || []
    }
  };
};

/**
 * Returns complete relations from model definition.
 *
 * @param {string} name - Singular model name
 *
 * @return {Object}
 */
export var relations = function relations(name) {
  return models[name].relations;
};

/**
 * Returns the plural form of a singular name from `names` var, or adds an 's'...
 *
 * @param {string} name - Singular model name
 *
 * @return {string}
 */
export var plural = function plural(name) {
  if (names.plurals[name]) {
    // console.log(`Plural found for ${name}`);
    return names.plurals[name];
  }
  console.error("Plural not found for " + name + ", falling back");
  return name + "s";
};

/**
 * Returns the singular form of a plural name from `names` var or removes the last char.
 *
 * @param {string} name - Plural model name
 *
 * @return {string}
 */
export var singular = function singular(name) {
  if (names.singulars[name]) {
    // console.log(`Singular found for ${name}`);
    return names.singulars[name];
  }
  console.error("Singular not found for " + name + ", falling back.");
  return name.slice(0, name.length - 1);
};

export var fields = function fields(model) {
  return models[model].fields;
};

export default { models: models, names: names, locale: locale, generate: generate, fields: fields, relations: relations, plural: plural, singular: singular };