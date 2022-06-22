"use strict"

import * as python from "./python.js"
import "./typing.js"
import * as utils from "./utils.js"


/**
 * Read ROS network data file.
 * @param {string|File} source - Data file (.toml), its data as string or its URL.
 * @returns {Map.<string, ?>} Object that contains parsed TOML contents.
 */
async function readTOML(source) {
    const toml = python.getPythonModule("./src/python/toml.py")

    let tomlText = ""
    if ((source instanceof String) || (typeof source === "string")) {
        try {  // ``source`` is comma-separated URLs
            for (let src of source.split(",")) {
                const url = new URL(src)
                const _data = await fetch(url)
                tomlText += "\n" + await _data.text()
            }
        } catch (err) {  // ``source`` is plain TOML text
            tomlText = source
        }
    } else {  // ``source`` is Array of File-s
        const promises = source.map(async file => { tomlText += "\n" + await file.text() })
        await Promise.all(promises)
    }
    const tomlParser = await toml  // Wait for Python module loading completes.
    const parsedData = tomlParser(tomlText)

    const networkData = fileStructureToROSNetwork(parsedData)
    return formatData(networkData)
}


/**
 * Convert file structure to network structure.
 * @param {Map.<string, ?>} data - Object that describes package structure.
 * @returns {RawNetworkData} Reconstructed ROS node data.
 */
function fileStructureToROSNetwork(data) {
    const flatData = utils.alignMapDepth(data.get("necst"), 1)

    const nodeData = new Map()
    for (let [k, v] of flatData) {
        if (v.has("node")) {
            nodeData.set(v.get("node"),
                {
                    name: v.get("node"),
                    publish: v.get("publish") || [],
                    subscribe: v.get("subscribe") || []
                }
            )
        }
    }
    return { nodes: nodeData }
}


/**
 * Get formatted data of ROS network.
 * @param {RawNetworkData} data - ROS network data, parsed from TOML file(s).
 * @returns {FormattedNetworkData} Formatted and completed ROS network data.
 */
function formatData(data) {
    if (!data.nodes && !data.topics) {
        throw TypeError(`Invalid data; either of [nodes, topics] field is required.`)
    }

    data.nodes = utils.ensureMapObj(data.nodes, { key: "name", sorted: true })
    data.topics = utils.ensureMapObj(data.topics, { key: "name", sorted: true })

    const append = (mapObj, keyName, propName, value) => {
        if (!mapObj.has(keyName)) { mapObj.set(keyName, { name: keyName }) }
        if (!mapObj.get(keyName)[propName]) { mapObj.get(keyName)[propName] = [] }
        mapObj.get(keyName)[propName].push(value)
    }

    if (!data.nodes) {
        const nodes = new Map()
        for (let [topic, v] of data.topics) {
            v.source.forEach(nodeName => append(nodes, nodeName, "publish", topic))
            v.target.forEach(nodeName => append(nodes, nodeName, "subscribe", topic))
        }
        return { nodes: nodes, topics: data.topics }
    }
    if (!data.topics) {
        const topics = new Map()
        for (let [node, v] of data.nodes) {
            v.publish.forEach(topicName => append(topics, topicName, "from", node))
            v.subscribe.forEach(topicName => append(topics, topicName, "to", node))
        }
        return { nodes: data.nodes, topics: topics }
    }
    return data
}


export { readTOML }
