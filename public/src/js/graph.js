"use strict"

import "./typing.js"
import * as utils from "./utils.js"


/**
 * Decipher ROS network structure.
 * @param {FormattedNetworkData} data - ROS network information.
 */
class NetworkGraph {
    constructor(data) { this.data = data }

    /**
     * Generate data for network graph.
     * @param {string} [name] - Name of node or topic to focus on.
     * @returns {NetworkData} Data for network graph.
     */
    focusOn(name) {
        if (!name) { name = this.data.nodes.keys().next().value }
        const network = this.#resolveNetwork([name])
        const adjacentNodes = this.#getAdjacentNodes(name)

        const nodeGrp = {
            thisNode: { member: new Set([name]) },
            sameLevel: { member: adjacentNodes.sameLevel },
            upstream: { member: adjacentNodes.upstream },
            downstream: { member: adjacentNodes.downstream },
            other: {}
        }
        let alreadyIncluded = utils.SetOps.union(
            utils.getProp(nodeGrp, ["thisNode", "sameLevel", "upstream", "downstream"])
                .map(d => d.member)
        )
        nodeGrp.other.member = utils.SetOps.difference(
            new Set(network.nodes.keys()), alreadyIncluded
        )

        for (let kind of Object.keys(nodeGrp)) {
            const nNode = nodeGrp[kind].nNode = nodeGrp[kind].member.size
            nodeGrp[kind].coords = this.#getNodeCoordinates(nNode, { type: kind })
        }
        const assignCoord = (coord, node) => {
            node.x = coord.x.next().value
            node.y = coord.y.next().value
        }
        for (let [name, node] of network.nodes) {
            Object.values(nodeGrp).forEach(meta => {
                if (meta.member.has(node.name)) { assignCoord(meta.coords, node) }
            })
        }

        return network
    }

    /**
     * Recursively resolve ROS network structure, about given node or topic.
     * @param {Array.<string>} names - Name of node or topic involved in the network.
     * @param {NetworkData} [resolved] - Network information resolved so far.
     * @returns {NetworkData} Minimal information of the ROS network.
     */
    #resolveNetwork(names, resolved) {
        if (names.length === 0) { return resolved }
        if (!resolved) { resolved = { nodes: new Map(), topics: new Map() } }

        const needFurtherIntrospection = []
        for (let name of names) {
            if (this.data.nodes.has(name) && this.data.topics.has(name)) {
                throw new TypeError(`Duplicated name: '${name}' both in node & topic.`)
            }
            if (this.data.nodes.has(name) && !resolved.nodes.has(name)) {
                const node = this.data.nodes.get(name)
                resolved.nodes.set(node.name, { name: node.name })
                needFurtherIntrospection.push(...node.publish)
                needFurtherIntrospection.push(...node.subscribe)
            }
            if (this.data.topics.has(name) && !resolved.topics.has(name)) {
                const topic = this.data.topics.get(name)
                const connections = utils.getAllCombinations(topic.from, topic.to)
                connections.forEach(({ source, target }, idx) => {
                    resolved.topics.set(topic.name + "_" + idx, {
                        name: topic.name, source: source, target: target
                    })
                })
                needFurtherIntrospection.push(...(topic.from || []))
                needFurtherIntrospection.push(...(topic.to || []))
            }
        }
        return this.#resolveNetwork([...new Set(needFurtherIntrospection)], resolved)
    }

    /**
     * List adjacent nodes of specified node or topic.
     * @param {string} name - Name of node or topic at the center.
     * @returns {AdjacentNodeNames} Information of adjacent nodes.
     */
    #getAdjacentNodes(name) {
        const adjacentNodes = { upstream: [], downstream: [], sameLevel: [] }

        if (this.data.nodes.has(name)) {
            adjacentNodes.thisNode = name
            const node = this.data.nodes.get(name)
            node.publish.forEach(
                n => adjacentNodes.downstream
                    .push(...this.#getAdjacentNodes(n).downstream)
            )
            node.subscribe.forEach(
                n => adjacentNodes.upstream.push(...this.#getAdjacentNodes(n).upstream)
            )
            // Safely ignore ``this.#getAdjacentNodes(n).sameLevel``, since if it
            // exists, it's always the same as ``adjacentNodes.thisNode``.
        }
        if (this.data.topics.has(name)) {
            const topic = this.data.topics.get(name)
            adjacentNodes.upstream.push(...(topic.from || []))
            adjacentNodes.downstream.push(...(topic.to || []))
        }

        for (let prop of ["upstream", "downstream", "sameLevel"]) {
            adjacentNodes[prop] = new Set(adjacentNodes[prop])
            adjacentNodes[prop].delete(adjacentNodes.thisNode)
        }

        adjacentNodes.sameLevel = utils.SetOps.intersection(
            adjacentNodes.upstream, adjacentNodes.downstream
        )
        for (let node of adjacentNodes.sameLevel) {
            adjacentNodes.upstream.delete(node)
            adjacentNodes.downstream.delete(node)
        }

        return adjacentNodes
    }

    /**
     * Calculate 2-dimensional positions of nodes in a figure, in %.
     * @param {number} nElems - Number of nodes.
     * @param {string} [type] - Kind of nodes.
     * @returns {XYData.<Generator<number, void, ?>>} Position generators for each axes.
     */
    #getNodeCoordinates(nElems, { type = "" } = {}) {
        let xr, yr
        if (type.valueOf() === "upstream") { xr = [25], yr = [15, 85] }
        else if (type.valueOf() === "thisNode") { xr = [50], yr = [30, 70] }
        else if (type.valueOf() === "sameLevel") { xr = [50], yr = [5, 25] }
        else if (type.valueOf() === "downstream") { xr = [75], yr = [15, 85] }
        else { xr = [35, 65], yr = [80] }

        const xRange = utils.centeredRange(nElems, ...xr)
        const yRange = utils.centeredRange(nElems, ...yr)
        return { x: xRange, y: yRange }
    }
}


export { NetworkGraph }
