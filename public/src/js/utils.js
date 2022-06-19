"use strict"


/**
 * Convert to Map object, if possible.
 * @param {Map|Array|Object} obj - Object to validate its type.
 * @param {string} [key] - Key to extract, when given ``obj`` is Array of Objects.
 * @param {boolean} [sorted] - If true, returned Map is sorted by its keys.
 * @returns {Map|undefined} Map object with its contents identical to the inputs.
 */
function ensureMapObj(obj, { key, sorted } = {}) {
    const finalize = (mapObj, sort) => {
        return sort ? new Map([...mapObj.entries()].sort()) : mapObj
    }
    if (obj instanceof Map) { return finalize(obj, sorted) }
    if (obj instanceof Array) { return finalize(new Map(obj.map(d => [d[key], d]))) }
    if (obj instanceof Object) { return finalize(new Map(Object.entries(obj))) }
}


/**
 * Flatten nested Object, with its structure is kept as dot-separated key.
 * @param {Object} obj - Object to flatten.
 * @returns {Object} - Object with no nested Object.
 */
function flattenObject(obj) {
    const flatObj = {}
    for (let key of Object.keys(obj)) {
        const subObj = obj[key]
        if ((typeof subObj === "object") && !Array.isArray(subObj) && subObj !== null) {
            const flattened = flattenObject(subObj)
            Object.keys(flattened).forEach(k => flatObj[key + "." + k] = flattened[k])
        } else {
            flatObj[key] = obj[key]
        }
    }
    return flatObj
}


/**
 * Split text by ``separator``, searching from right.
 * @param {string} text - Text to be split.
 * @param {string} separator - Pattern where each split occur.
 * @param {number} limit - Limit on number of substrings.
 * @returns {Array.<string>}
 */
function rsplit(text, separator, limit) {
    const split = text.split(separator)
    return limit
        ? [split.slice(0, -limit).join(separator)].concat(split.slice(-limit)) : split
}


/**
 * Align the depth of Object nesting.
 * @param {Object} obj - Object to align the depth.
 * @param {number} depth - Max depth of the returned object, should be positive integer.
 * @returns {Object} Object of uniform depth. Shallower structures are kept as is.
 */
function alignObjectDepth(obj, depth = 1, { _reserveStructure = false } = {}) {
    if (depth < 1) { return obj }
    console.log(obj)

    if (!_reserveStructure) { obj = flattenObject(obj) }
    const groupedObj = {}
    for (let key of Object.keys(obj)) {
        const [newKey, newPropName] = rsplit(key, ".", 1)
        if (newKey === "") {
            groupedObj[key] = obj[key]
        } else {
            if (!groupedObj[newKey]) { groupedObj[newKey] = {} }
            groupedObj[newKey][newPropName] = obj[key]
        }
    }

    return alignObjectDepth(groupedObj, depth - 1, { _reserveStructure: true })
}


export { ensureMapObj, rsplit, alignObjectDepth }
