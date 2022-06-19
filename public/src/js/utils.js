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
 * Flatten nested Map, with its structure is kept as dot-separated key.
 * @param {Map.<?, Map|?>} map - Map object to flatten.
 * @returns {Map.<?, ?>} - Object with no nested Object.
 */
function flattenMap(map) {
    const flatMap = new Map()
    for (let [key, value] of map) {
        if (value instanceof Map) {
            const flattened = flattenMap(value)
            for (let [k, v] of flattened) { flatMap.set(key + "." + k, v) }
        } else {
            flatMap.set(key, value)
        }
    }
    return flatMap
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
 * Align the depth of Map object nesting.
 * @param {Map.<string|?, Map|?>} map - Map to align the depth.
 * @param {number} depth - Max depth of the returned Map, should be positive integer.
 * @returns {Map.<string, ?>} Map of uniform depth. Shallower structures are kept as is.
 */
function alignMapDepth(map, depth = 1, { _reserveStructure = false } = {}) {
    if (depth < 1) { return map }

    if (!_reserveStructure) { map = flattenMap(map) }
    const groupedMap = new Map()
    for (let [key, value] of map) {
        const [newKey, newPropName] = rsplit(key, ".", 1)
        if (newKey === "") {
            groupedMap.set(key, value)
        } else {
            if (!groupedMap.get(newKey)) { groupedMap.set(newKey, new Map()) }
            groupedMap.get(newKey).set(newPropName, value)
        }
    }

    return alignMapDepth(groupedMap, depth - 1, { _reserveStructure: true })
}


export { ensureMapObj, rsplit, alignMapDepth }
