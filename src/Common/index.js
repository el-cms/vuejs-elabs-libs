/**
 * Common methods used through the app
 *
 * @module common
 */
export default{
  /**
   * Generates a random string of given length
   *
   * @param {number} [size=5] - String length
   *
   * @return {string}
   */
  randomChar: (size = 5) => Math.random().toString(36).substr(2, size),

  /**
   * Check if a given var is an object (can be an array as well)
   *
   * @param {*} object  - The variable to test
   *
   * @return {Boolean} - True if the variable is actually an object
   */
  isObj: object => object !== null && typeof object === 'object',

  /**
   * Check if a given var is an array.
   *
   * @param {*} array  - The variable to test
   *
   * @return {Boolean} - True if the variable is actually an array
   * /
   isArray: array => Object.prototype.toString.call(array) === '[object Array]',
   */

  /**
   * Helper function to check if an object has one given property
   *
   * @param {Object}    object   - The object to check
   * @param {string}    property - The property name
   *
   * @return {Boolean}          - true if the object contains the property
   */
  objHasKey (object, property) {
    if (this.isObj(object)) {
      return Object.prototype.hasOwnProperty.call(object, property)
    }
    // console.warn(`Warning in ObjHasKey(${property}) : object is not an object`, object);
    return false
  },

  /**
   * This callback should test an object and return true or false
   *
   * @callback filterObjCallback
   *
   * @param {Object}      entry        - Element to test
   * @param {string|null} [key=null]   - Optional key name
   *
   * @return {Boolean}                - True if the element should be kept
   */

  /**
   * Filters an of objects of the same type (like a collection) with a given test
   *
   * @param {Object}            obj   - Object to be filtered
   * @param {filterObjCallback} test  - Callback function like (element, key) => true/false
   * @param {Boolean}           first - Flag to only return the first matching element
   *
   * @return {Object}                - List of objects or entity
   */
  filterObj (obj, test, first = false) {
    if (obj !== null && typeof obj === 'object') {
      const results = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // console.log('trying', test, 'on', obj[key]);
          if (test(obj[key], key)) {
            if (first) {
              return obj[key]
            }
            results[key] = obj[key]
          }
        }
      }
      return results
    }

    throw new Error('The thing you try to filter is not an object.')
  },

  /**
   * Sorts an object of object like a VueX store data structure by a field name
   *   i.e.: `{ id:{obj}, id:{obj}, ...}`
   *   and returns a list like `[ [id: value], [id: value], ... ]`
   *
   * @param {Object} vuexResults - Collection of objects from a VueX getter
   * @param {string} fieldName   - Field on which to sort the object
   *
   * @return {Array}            - List of sorted [key,value] pairs
   */
  sortResultsByText (vuexResults, fieldName) {
    const keys = []
    for (const id in vuexResults) {
      if (vuexResults.hasOwnProperty(id)) {
        keys.push([id, vuexResults[id][fieldName]])
      }
    }
    keys.sort((a, b) => {
      const x = a[1].toLowerCase()
      const y = b[1].toLowerCase()
      return x < y ? -1 : x > y ? 1 : 0 // eslint-disable-line no-nested-ternary
    })
    return keys
  },

  /**
   * Shuffles an array's elements
   *
   * @see http://stackoverflow.com/questions/2450954/ddg#2450976
   *
   * @param {Array} array - List to shuffle
   *
   * @return {Array}     - Shuffled list
   */
  shuffleArray (array) {
    let currentIndex = array.length
    let temporaryValue
    let randomIndex

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }
}
