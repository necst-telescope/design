"use strict"

import "./typing.js"


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


/**
 * Expand source-target pair, assuming all combinations are possible.
 * @param {Array.<?>} sources - Array of something's sources.
 * @param {Array.<?>} targets - Array of something's targets.
 * @returns {Array.<Combination>} Array of source and target pairs.
 */
function getAllCombinations(sources, targets) {
    if (!targets) { return sources.map(s => ({ source: s, target: null })) }
    if (!sources) { return targets.map(t => ({ source: null, target: t })) }
    const combinations = []
    for (let s of sources) {
        targets.forEach(t => combinations.push({ source: s, target: t }))
    }
    return combinations
}


/**
 * Get equi-partitioned values, which center positioned at the center of the range.
 * @param {int} nElems - Number of values to yield.
 * @param {number} rangeStart - Start of the range.
 * @param {number} [rangeEnd] - End of the range.
 * @yields {number} Equi-partitioned value in the range [rangeStart, rangeEnd].
 */
function* centeredRange(nElems, rangeStart, rangeEnd) {
    if (arguments.length < 3) { rangeEnd = rangeStart }
    const center = (rangeEnd + rangeStart) / 2
    const diff = rangeEnd - rangeStart
    for (let i = 0; i < nElems; i++) {
        yield diff * (2 * i + 1 - nElems) / (2 * nElems /* +shrink */) + center
    }
}


class SetOps {
    /**
     * Compute union of 2 sets.
     * @param {Set.<?>} a - First Set object.
     * @param {Set.<?>} b - Second Set object.
     * @returns {Set.<?>} New set with elements belongs to ``a`` and/or ``b``.
     */
    static union(a, b, ...c) {
        if (arguments.length < 2) { [a, b, ...c] = a }
        const _union = new Set(a)
        for (let elem of b) { _union.add(elem) }
        return (c.length > 0) ? this.union(_union, ...c) : _union
    }

    /**
     * Compute difference of 2 sets.
     * @param {Set.<?>} a - First Set object.
     * @param {Set.<?>} b - Second Set object.
     * @returns {Set.<?>} New set with elements belongs to ``a``, but not to ``b``.
     */
    static difference(a, b) {
        const _difference = new Set(a)
        for (let elem of b) { _difference.delete(elem) }
        return _difference
    }

    /**
     * Compute intersection of 2 sets.
     * @param {Set.<?>} a - First set.
     * @param {Set.<?>} b - Second set.
     * @returns {Set.<?>} New set with elements belongs to both ``a`` and ``b``.
     */
    static intersection(a, b) {
        const _intersection = new Set()
        for (let elem of b) { if (a.has(elem)) { _intersection.add(elem) } }
        return _intersection
    }
}


/**
 * Extract multiple properties at once.
 * @param {Object} obj - Object to extract properties.
 * @param  {...string|Array.<string>} propNames - Property names.
 * @returns {Array.<?>} Extracted properties.
 */
function getProp(obj, ...propNames) { return propNames.flat().map(p => obj[p]) }


/**
 * Validate the characters used in HTML element ID.
 * @param {string} id HTML element ID to validate.
 * @returns {string} ID consists of valid characters; alphanumeric + "_-:."
 */
function validateId(id) { return id.replace(/[^a-zA-Z0-9.:_-]/g, ".") }


class MathOps {
    /**
     * Sums the numbers in an Array.
     * @param {Array.<number>} arr - Array of numbers.
     * @returns {number} Sum of the ``arr``.
     */
    static sum(arr) { return arr.reduce((a, b) => a + b, 0) }

    /**
     * Get mean value of numbers in an Array.
     * @param {Array.<number>} arr - Array of numbers.
     * @returns {number} Mean value of numbers in ``arr``.
     */
    static mean(arr) { return (this.sum(arr) / arr.length) || 0 }
}


export {
    ensureMapObj,
    rsplit,
    alignMapDepth,
    getAllCombinations,
    centeredRange,
    SetOps,
    getProp,
    validateId,
    MathOps,
}
