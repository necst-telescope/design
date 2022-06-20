"use strict"

import "./typing.js"
import * as utils from "./utils.js"


/**
 * Decipher ROS network structure.
 * @param {FormattedNetworkData} data - ROS network information.
 */
class NetworkGraph {
    constructor(data) {
        this.data = data
        this.network = this.focusOn()
    }

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

        this.network = network
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


class NetworkDiagram extends NetworkGraph {

    constructor(data) {
        super(data)

        this.unknown = { x: 52, y: 52 }

        const margin = { top: 15, bottom: 15, left: 15, right: 15 }
        const size = { width: 1000, height: 500 }
        this.x = d3.scaleLinear()
            .domain([0, 100])
            .range([margin.left, size.width - margin.right])
        this.y = d3.scaleLinear()
            .domain([0, 100])
            .range([margin.top, size.height - margin.bottom])

        d3.selectAll("#network-diagram > *").remove()
        this.canvas = d3.select("#network-diagram")
            .append("svg")
            .attr("viewBox", `0 0 ${size.width} ${size.height}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)

        this.canvas = this.canvas
        // XXX: Avoid `this` reference error, not accessible from outside the
        // constructor IDK why this fixes the problem.

        [this.topics, this.nodes] = this.#draw()
    }

    #draw() {
        this.focusOn()

        const topics = this.canvas.selectAll(".ros-topic")
            .data(this.network.topics)
            .enter()
            .append("g")
            .classed("ros-topic", true)
            .attr("id", d => utils.validateId(`ros-topic-${d[0]}`))
        topics.append("line")
            .classed("ros-topic-line", true)
            .attr("stroke", "#AAA")
        topics.append("text")
            .classed("ros-topic-label", true)
            .text(d => d[1].name)

        const nodes = this.canvas.selectAll(".ros-node")
            .data(this.network.nodes)
            .enter()
            .append("g")
            .classed("ros-node", true)
            .attr("id", d => utils.validateId(`ros-node-${d[1].name}`))
        nodes.append("rect")
            .classed("ros-node-bg", true)
            .attr("width", d => d[1].name.length * 10)
            .attr("height", 20)
            .style("fill", "#AFF")
        nodes.append("text")
            .classed("ros-node-label", true)
            .style("fill", "#00F")
            .text(d => d[1].name)

        this.topics = topics
        this.nodes = nodes

        this.draw()
    }

    #getCoord(axis, ...id) {
        const nodes = id.map(_id => this.network.nodes.get(_id))
        const coords = nodes.map(node => node?.[axis])
        const coord = utils.MathOps.mean(coords) || this.unknown[axis]
        return this[axis](coord)
    }

    draw(name) {
        this.focusOn(name)

        this.topics.selectAll("line")
            .transition()
            .attr("x1", d => this.#getCoord("x", d[1].source))
            .attr("x2", d => this.#getCoord("x", d[1].target))
            .attr("y1", d => this.#getCoord("y", d[1].source))
            .attr("y2", d => this.#getCoord("y", d[1].target))
        this.topics.selectAll("text")
            .transition()
            .attr("x", d => this.#getCoord("x", d[1].source, d[1].target))
            .attr("y", d => this.#getCoord("y", d[1].source, d[1].target))

        this.nodes.selectAll("rect")
            .transition()
            .attr("x", d => this.x(d[1].x))
            .attr("y", d => this.y(d[1].y) - 15)
        this.nodes.selectAll("text")
            .transition()
            .attr("x", d => this.x(d[1].x))
            .attr("y", d => this.y(d[1].y))

        // TODO: Add `drag` handler (translates the element) and `click` handler (center the clicked element).
    }
}


export { NetworkDiagram }
